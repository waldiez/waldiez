# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Comments to include in the generated code."""

PYLINT_RULES = [
    "line-too-long",
    "unknown-option-value",
    "unused-argument",
    "unused-import",
    "unused-variable",
    "invalid-name",
    "import-error",
    "inconsistent-quotes",
    "missing-function-docstring",
    "missing-param-doc",
    "missing-return-doc",
    "ungrouped-imports",
    "unnecessary-lambda-assignment",
]
PYRIGHT_RULES = [
    "reportUnusedImport",
    "reportMissingTypeStubs",
    "reportUnknownArgumentType",
    "reportUnknownMemberType",
    "reportUnknownLambdaType",
    "reportUnnecessaryIsInstance",
]


def get_pylint_ignore_comment(
    notebook: bool, rules: list[str] | None = None
) -> str:
    """Get the pylint ignore comment string.

    Parameters
    ----------
    notebook : bool
        Whether the comment is for a notebook.
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
    line = "# pylint: disable=" + ",".join(rules)
    if notebook is True:
        line = "\n" + line
    return line + "\n"


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
    line = "# pyright: " + ",".join([f"{rule}=false" for rule in rules])
    return line + "\n"
