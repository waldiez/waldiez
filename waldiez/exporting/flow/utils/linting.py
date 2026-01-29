# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Linting comments to include in the generated code."""

import math


def split_linter_comment(
    prefix: str,
    rules: list[str],
    max_lines: int = 3,
) -> str:
    """Split linter comment.

    Parameters
    ----------
    prefix : str
        The prefix for the comment, e.g., "# pylint: disable=" or "# pyright: ".
    rules : list[str]
        The list of linter rules to include in the comment.
    max_lines : int, optional
        The maximum number of lines to split the comment into, by default 3.

    Returns
    -------
    str
        The formatted comment string with the rules split into lines.
    """
    # Calculate minimum number of rules per line to not exceed max_lines
    rules_per_line = max(1, math.ceil(len(rules) / max_lines))
    # pylint: disable=inconsistent-quotes
    lines = [
        f"{prefix}{','.join(rules[i : i + rules_per_line])}"
        for i in range(0, len(rules), rules_per_line)
    ]
    return "\n".join(lines) + "\n"


PYLINT_RULES = [
    "broad-exception-caught",
    "f-string-without-interpolation",
    "invalid-name",
    "import-error",
    "import-outside-toplevel",
    "inconsistent-quotes",
    "line-too-long",
    "missing-function-docstring",
    "missing-param-doc",
    "missing-return-doc",
    "no-member",
    "pointless-string-statement",
    "too-complex",
    "too-many-arguments",
    "too-many-locals",
    "too-many-try-statements",
    "ungrouped-imports",
    "unnecessary-lambda-assignment",
    "unknown-option-value",
    "unused-argument",
    "unused-import",
    "unused-variable",
]
# including basedpyright specific (not pyright only) rules
PYRIGHT_RULES = [
    "reportArgumentType",
    "reportAssignmentType",
    "reportAttributeAccessIssue",
    "reportCallInDefaultInitializer",
    "reportConstantRedefinition",
    "reportDeprecated",
    "reportDuplicateImport",
    "reportMissingTypeStubs",
    "reportOperatorIssue",
    "reportOptionalMemberAccess",
    "reportPossiblyUnboundVariable",
    "reportUnreachable",
    "reportUnusedImport",
    "reportUnknownArgumentType",
    "reportUnknownMemberType",
    "reportUnknownLambdaType",
    "reportUnnecessaryIsInstance",
    "reportUnusedParameter",
    "reportUnusedVariable",
    "reportUnknownVariableType",
]

MYPY_RULES = [
    "import-untyped",
    "no-redef",
    "unused-ignore",
    "import-not-found",
]

FLAKE8_RULES = ["E501"]


def get_flake8_ignore_comment(rules: list[str] | None = None) -> str:
    """Get the flake8 ignore comment string.

    Parameters
    ----------
    rules : Optional[list[str]], optional
        The flake8 rules to ignore, by default None.

    Returns
    -------
    str
        The flake8 ignore comment string.

    Example
    -------
    ```python
    >>> get_flake8_ignore_comment(["E501", "F401"])

    # flake8: noqa: E501, F401
    ```
    """
    if not rules:
        rules = FLAKE8_RULES
    prefix = "# flake8: noqa: "
    output = ", ".join(rules)
    return prefix + output + "\n"


def get_pylint_ignore_comment(rules: list[str] | None = None) -> str:
    """Get the pylint ignore comment string.

    Parameters
    ----------
    rules : Optional[list[str]], optional
        The pylint rules to ignore, by default None.

    Returns
    -------
    str
        The pylint ignore comment string.

    Example
    -------
    ```python
    >>> get_pylint_ignore_comment(True, ["invalid-name", "line-too-long"])

    # pylint: disable=invalid-name, line-too-long
    ```
    """
    if not rules:
        rules = PYLINT_RULES
    prefix = "# pylint: disable="
    return split_linter_comment(
        prefix,
        rules,
        max_lines=3,
    )


def get_pyright_ignore_comment(rules: list[str] | None = None) -> str:
    """Get the pyright ignore comment string.

    Parameters
    ----------
    rules : Optional[list[str]], optional
        The pyright rules to ignore, by default None.

    Returns
    -------
    str
        The pyright ignore comment string.

    Example
    -------
    ```python
    >>> get_pyright_ignore_comment(
    ...     True,
    ...     ["reportUnusedImport", "reportMissingTypeStubs"]
    ... )

    # pyright: reportUnusedImport=false, reportMissingTypeStubs=false
    ```
    """
    if not rules:
        rules = PYRIGHT_RULES
    prefix = "# pyright: "
    output = split_linter_comment(
        prefix,
        [f"{rule}=false" for rule in rules],
        max_lines=3,
    )
    return output


def get_mypy_ignore_comment(rules: list[str] | None = None) -> str:
    """Get the mypy ignore comment string.

    Parameters
    ----------
    rules : Optional[list[str]], optional
        The mypy rules to ignore, by default None.

    Returns
    -------
    str
        The mypy ignore comment string.

    Example
    -------
    ```python
    >>> get_mypy_ignore_comment(["import-untyped", "no-redef"])

    # mypy: disable-error-code="import-untyped,no-redef"
    ```
    """
    if rules is None:
        rules = MYPY_RULES
    if not rules:
        return "# type: ignore\n"
    prefix = "# mypy: disable-error-code="
    content = ", ".join(rules)
    return prefix + f'"{content}"\n'
