# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Content merger for combining multiple export results."""

from dataclasses import dataclass, field

from ..core import (
    ContentOrder,
    EnvironmentVariable,
    ExporterContext,
    ExportResult,
    ImportStatement,
    PositionedContent,
    ValidationError,
    ValidationResult,
)


@dataclass
class MergeStatistics:
    """Statistics about the merge operation."""

    total_results: int = 0
    total_imports: int = 0
    deduplicated_imports: int = 0
    total_content_items: int = 0
    total_env_vars: int = 0
    deduplicated_env_vars: int = 0
    conflicts_found: list[str] = field(default_factory=list[str])


class ContentMerger:
    """Intelligently merges multiple ExportResult objects."""

    def __init__(self, context: ExporterContext | None = None):
        """Initialize the content merger.

        Parameters
        ----------
        context : ExporterContext | None, optional
            The exporter context, by default None
        """
        self.context = context or ExporterContext()
        self.statistics = MergeStatistics()

    def merge_results(self, results: list[ExportResult]) -> ExportResult:
        """Merge multiple export results into one.

        Parameters
        ----------
        results : list[ExportResult]
            The export results to merge

        Returns
        -------
        ExportResult
            The merged export result
        """
        if not results:
            return ExportResult()

        if len(results) == 1:
            return results[0]

        # Initialize statistics
        self.statistics = MergeStatistics(total_results=len(results))

        # Create merged result
        merged = ExportResult()

        # 1. Merge imports with intelligent deduplication
        merged.imports = self._merge_imports(results)

        # 2. Merge positioned content with proper ordering
        merged.positioned_content = self._merge_positioned_content(results)

        # 3. Merge environment variables with conflict detection
        merged.environment_variables = self._merge_environment_variables(
            results
        )

        # 4. Merge validation results
        merged.validation_result = self._merge_validation_results(results)

        # 5. Handle main content (typically empty for merged results)
        merged.main_content = self._merge_main_content(results)

        return merged

    def _merge_imports(
        self, results: list[ExportResult]
    ) -> set[ImportStatement]:
        """Merge imports with intelligent deduplication and prioritization.

        Parameters
        ----------
        results : list[ExportResult]
            The export results containing imports

        Returns
        -------
        set[ImportStatement]
            The merged and deduplicated imports
        """
        all_imports: set[ImportStatement] = set()

        # Collect all imports
        for result in results:
            all_imports.update(result.imports)
            self.statistics.total_imports += len(result.imports)

        # Deduplicate based on statement content, keeping best position
        deduplicated = self._deduplicate_imports(all_imports)

        self.statistics.deduplicated_imports = len(deduplicated)

        return deduplicated

    def _deduplicate_imports(
        self, imports: set[ImportStatement]
    ) -> set[ImportStatement]:
        """Deduplicate imports intelligently.

        Rules:
        1. Keep import with highest priority (BUILTINS > THIRD_PARTY > LOCAL)
        2. For same position, keep the one with more metadata
        3. Detect conflicts and warn

        Parameters
        ----------
        imports : set[ImportStatement]
            The imports to deduplicate

        Returns
        -------
        set[ImportStatement]
            The deduplicated imports
        """
        # Group by statement content
        grouped: dict[str, ImportStatement] = {}
        conflicts: list[str] = []

        for imp in imports:
            key = imp.statement.strip()

            if key not in grouped:
                grouped[key] = imp
            else:
                existing = grouped[key]

                # Prioritize by position (lower enum value = higher priority)
                if imp.position.value < existing.position.value:
                    # New import has higher priority position
                    grouped[key] = imp
                elif imp.position.value == existing.position.value:
                    # Same position - check for conflicts
                    if imp.metadata != existing.metadata:
                        conflicts.append(
                            f"Import '{key}' has conflicting metadata: "
                            f"{existing.metadata} vs {imp.metadata}"
                        )
                    # Keep existing (first wins for same priority)

        if conflicts:
            self.statistics.conflicts_found.extend(conflicts)
            # Log conflicts but continue
            for conflict in conflicts:
                self.context.get_logger().warning(
                    "Import conflict: %s", conflict
                )

        return set(grouped.values())

    def _merge_positioned_content(
        self, results: list[ExportResult]
    ) -> list[PositionedContent]:
        """Merge positioned content with proper ordering.

        The challenge: Different exporters add content at different positions,
        and we need to maintain the correct order while handling a
        gent-specific positioning.

        Parameters
        ----------
        results : list[ExportResult]
            The export results containing positioned content

        Returns
        -------
        list[PositionedContent]
            The merged and properly ordered content
        """
        all_content: list[PositionedContent] = []

        # Collect all positioned content
        for result in results:
            all_content.extend(result.positioned_content)
            self.statistics.total_content_items += len(
                result.positioned_content
            )

        # Sort by complex criteria for proper ordering
        sorted_content = self._sort_positioned_content(all_content)

        return sorted_content

    def _sort_positioned_content(
        self, content: list[PositionedContent]
    ) -> list[PositionedContent]:
        """Sort positioned content by multiple criteria.

        Sorting Priority:
        1. ExportPosition (TOP, IMPORTS, TOOLS, MODELS, AGENTS, CHATS, BOTTOM)
        2. ContentOrder within position (EARLY_SETUP, SETUP, MAIN_CONTENT, etc.)
        3. Agent ID (for agent-specific content)
        4. AgentPosition (BEFORE_ALL, BEFORE, AS_ARGUMENT, AFTER, AFTER_ALL)
        5. Original order (for stability)

        Parameters
        ----------
        content : list[PositionedContent]
            The content to sort

        Returns
        -------
        list[PositionedContent]
            The sorted content
        """
        return sorted(
            content,
            key=lambda pc: (
                pc.position.value,  # 1. ExportPosition enum value
                self._get_order_value(
                    pc.order
                ),  # 2. ContentOrder numeric value
                pc.agent_id
                or "",  # 3. Agent ID (empty string for non-agent content)
                (
                    pc.agent_position.value if pc.agent_position else 0
                ),  # 4. AgentPosition
                id(pc),  # 5. Original object ID for stability
            ),
        )

    # pylint: disable=no-self-use
    # noinspection PyMethodMayBeStatic
    def _get_order_value(self, order: int | ContentOrder) -> int:
        """Get numeric value from order for sorting.

        Parameters
        ----------
        order : int | ContentOrder
            The order value

        Returns
        -------
        int
            The numeric order value
        """
        return order.value if isinstance(order, ContentOrder) else order

    def _merge_environment_variables(
        self, results: list[ExportResult]
    ) -> list[EnvironmentVariable]:
        """Merge environment variables with conflict detection.

        Rules:
        1. Deduplicate by variable name
        2. Detect value conflicts and warn
        3. Keep first occurrence for conflicts
        4. Preserve metadata and descriptions

        Parameters
        ----------
        results : list[ExportResult]
            The export results containing environment variables

        Returns
        -------
        list[EnvironmentVariable]
            The merged environment variables
        """
        env_vars: dict[str, EnvironmentVariable] = {}
        conflicts: list[str] = []
        for result in results:
            for env_var in result.environment_variables:
                self.statistics.total_env_vars += 1
                key = env_var.name
                if key in env_vars:
                    existing = env_vars[key]

                    # Check for value conflicts
                    if existing.value != env_var.value:
                        conflicts.append(
                            f"Environment variable '{key}' has conflicting "
                            f"values: '{existing.value}' vs '{env_var.value}'"
                        )
                    # Keep first occurrence
                    # (tools/models take precedence over agents)

                else:
                    env_vars[key] = env_var

        self.statistics.deduplicated_env_vars = len(env_vars)

        if conflicts:
            self.statistics.conflicts_found.extend(conflicts)
            # Log conflicts but continue (non-fatal)
            for conflict in conflicts:
                self.context.get_logger().warning(
                    "Environment variable conflict: %s", conflict
                )

        return list(env_vars.values())

    def _merge_validation_results(
        self, results: list[ExportResult]
    ) -> ValidationResult:
        """Merge validation results from all export results.

        Parameters
        ----------
        results : list[ExportResult]
            The export results containing validation results

        Returns
        -------
        ValidationResult
            The merged validation result
        """
        all_errors: list[ValidationError] = []
        all_warnings: list[ValidationError] = []

        for result in results:
            if result.validation_result:
                all_errors.extend(result.validation_result.errors)
                all_warnings.extend(result.validation_result.warnings)

        # Add merger-specific warnings
        if self.statistics.conflicts_found:
            all_warnings.extend(
                [
                    ValidationError(message=f"Merge conflict: {conflict}")
                    for conflict in self.statistics.conflicts_found
                ]
            )

        return ValidationResult(
            is_valid=not all_errors,
            errors=all_errors,
            warnings=all_warnings,
        )

    # noinspection PyMethodMayBeStatic
    def _merge_main_content(self, results: list[ExportResult]) -> str | None:
        """Merge main content from results.

        For flow exports, main content is typically empty since all content
        is positioned. But we handle it for completeness.

        Parameters
        ----------
        results : list[ExportResult]
            The export results

        Returns
        -------
        str | None
            The merged main content, or None
        """
        main_contents: list[str] = []

        for result in results:
            if result.main_content and result.main_content.strip():
                main_contents.append(result.main_content.strip())

        return "\n\n".join(main_contents) if main_contents else None

    def get_merge_statistics(self) -> MergeStatistics:
        """Get statistics about the last merge operation.

        Returns
        -------
        MergeStatistics
            Statistics about the merge operation
        """
        return self.statistics
