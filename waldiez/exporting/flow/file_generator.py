# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Generate the whole flow content."""

from typing import Any

from ..core import (
    ContentGenerator,
    ExporterContentError,
    ExporterContext,
    ExportPosition,
    ExportResult,
    PositionedContent,
    get_comment,
)
from .execution_generator import ExecutionGenerator
from .utils.common import generate_header


# noinspection PyProtocol
class FileGenerator(ContentGenerator):
    """Generate the complete flow notebook content."""

    def __init__(
        self,
        context: ExporterContext,
    ) -> None:
        """Initialize the notebook generator.

        Parameters
        ----------
        context : ExporterContext
            The exporter context containing dependencies.
        """
        self.context = context
        self.config = context.get_config()
        self.cache_seed = (
            self.context.config.cache_seed if self.context.config else None
        )

    # pylint: disable=too-many-locals,unused-argument
    def generate(
        self,
        merged_result: ExportResult,
        is_async: bool,
        after_run: str,
        skip_logging: bool,
        **kwargs: Any,
    ) -> str:
        """Generate content based on provided parameters.

        Parameters
        ----------
        merged_result : ExportResult
            The merged export result containing all content.
        is_async : bool
            Whether to generate async content.
        after_run : str
            Additional content to add after the main flow execution.
        skip_logging : bool
            Whether to skip logging setup.
        **kwargs : Any
            Parameters to influence content generation.

        Returns
        -------
        str
            The generated content.

        Raises
        ------
        ExporterContentError
            If there is no content to export.
        """
        # 1. Generate header
        header = self.get_header(merged_result)

        # 2. Generate imports
        imports_section = merged_result.get_content_by_position(
            ExportPosition.IMPORTS
        )

        # 3. Generate content sections
        tools_section = merged_result.get_content_by_position(
            ExportPosition.TOOLS
        )
        models_section = merged_result.get_content_by_position(
            ExportPosition.MODELS
        )
        agents_section = merged_result.get_content_by_position(
            ExportPosition.AGENTS,
            # Skip agent arguments (should already be there)
            skip_agent_arguments=True,
        )
        chats_content = merged_result.get_content_by_position(
            ExportPosition.CHATS
        )
        if not chats_content:
            raise ExporterContentError(
                "No content to export. Please ensure that the flow has chats."
            )
        after_chats = merged_result.get_content_by_position(
            ExportPosition.BOTTOM
        )

        main, call_main, execution_block = self._get_execution_content(
            chats_content=chats_content,
            is_async=is_async,
            after_run=after_run,
            for_notebook=self.config.for_notebook,
            skip_logging=skip_logging,
        )

        # 5. Combine everything
        everything: list[str] = [header]
        if imports_section:
            comment = get_comment(
                "Imports",
                for_notebook=self.config.for_notebook,
            )
            everything.append(comment)
            everything.append(
                "\n".join([entry.content for entry in imports_section])
            )
        everything.append(FileGenerator._get_globals(self.cache_seed))
        if tools_section:
            comment = get_comment(
                "Tools",
                for_notebook=self.config.for_notebook,
            )
            everything.append(comment)
            everything.append(
                "\n".join([entry.content for entry in tools_section]) + "\n"
            )
        if models_section:
            comment = get_comment(
                "Models",
                for_notebook=self.config.for_notebook,
            )
            everything.append(comment)
            everything.append(
                "\n\n".join([entry.content for entry in models_section]) + "\n"
            )
        if agents_section:
            comment = get_comment(
                "Agents",
                for_notebook=self.config.for_notebook,
            )
            everything.append(comment)
            everything.append(
                "\n\n".join([entry.content for entry in agents_section]) + "\n"
            )
        everything.append(main)
        if after_chats:
            everything.append(
                "\n".join([entry.content for entry in after_chats])
            )
        everything.append(call_main)
        if execution_block:
            everything.append(execution_block)

        return "\n".join(everything)

    @staticmethod
    def _get_globals(cache_seed: int | None) -> str:
        """Get global definitions and initializations."""
        return f'''

class GroupDict(TypedDict):
    """Group related global dict."""
    chats: dict[str, GroupChat]
    patterns: dict[str, Pattern]

__GROUP__: GroupDict = {{"chats": {{}}, "patterns": {{}}}}

__AGENTS__: dict[str, ConversableAgent] = {{}}

__CACHE_SEED__: int | None = {cache_seed}

'''

    def _get_execution_content(
        self,
        chats_content: list[PositionedContent],
        is_async: bool,
        for_notebook: bool,
        after_run: str,
        skip_logging: bool,
    ) -> tuple[str, str, str]:
        execution_gen = ExecutionGenerator()
        chat_contents = "\n".join(chat.content for chat in chats_content)
        before_main = execution_gen.generate_store_error(is_async) + "\n\n"
        before_main += execution_gen.generate_store_results(is_async) + "\n\n"
        before_main += execution_gen.generate_prepare_resume(is_async) + "\n\n"
        main = before_main + execution_gen.generate_main_function(
            content=chat_contents,
            is_async=is_async,
            for_notebook=for_notebook,
            cache_seed=self.cache_seed,
            after_run=after_run,
            skip_logging=skip_logging,
        )
        call_main = execution_gen.generate_call_main_function(
            is_async=is_async,
            for_notebook=for_notebook,
        )
        execution_block = (
            execution_gen.generate_execution_block(
                is_async=is_async,
            )
            if not for_notebook
            else ""
        )
        return main, call_main, execution_block

    def get_header(self, merged_result: ExportResult) -> str:
        """Get or generate the header for the script.

        Parameters
        ----------
        merged_result : ExportResult
            The merged export result containing all content.

        Returns
        -------
        str
            The header content.
        """
        from_result = merged_result.get_content_by_position(ExportPosition.TOP)
        if not from_result:
            return generate_header(
                name=self.config.name,
                description=self.config.description,
                requirements=self.config.requirements,
                tags=self.config.tags,
                for_notebook=self.config.for_notebook,
            )
        header_string = "\n".join(item.content for item in from_result)
        while not header_string.endswith("\n\n"):
            header_string += "\n"
        return header_string
