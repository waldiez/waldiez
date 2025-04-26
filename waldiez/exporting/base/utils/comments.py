# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Utilities for comments.

Functions
---------
comment
    Get a comment string.
get_comment
    Get a comment string for some common keys (notebook headings).
"""

from typing_extensions import Literal

CommentKey = Literal[
    "agents", "imports", "skills", "models", "nested", "run", "logging"
]
"""Possible keys for comments."""


def comment(for_notebook: bool, hashtags: int = 1) -> str:
    """Get the comment string.

    Parameters
    ----------
    for_notebook : bool
        Whether the comment is for a notebook or not.
    hashtags : int, optional
        The number of hashtags (for notebooks), by default 1.

    Returns
    -------
    str
        The comment string.
    Example
    -------
    ```python
    >>> comment(True, 2)
    '## '
    >>> comment(False)
    '# '
    ```
    """
    content = "# "
    if for_notebook:
        content += "#" * hashtags + " "
    return content


def get_comment(
    key: CommentKey,
    for_notebook: bool,
) -> str:
    """Get a comment string for some common keys.

    The key is a heading (in a notebook) or just a comment (in a script).

    Parameters
    ----------
    key : "agents"|"imports"|"skills"|"models"|"nested"|"run"|"logging"
        The key.
    for_notebook : bool
        Whether the comment is for a notebook.

    Returns
    -------
    str
        The comment string.

    Example
    -------
    ```python
    >>> get_comment("agents", True)

    '## Agents'
    >>> get_comment("skills", False)

    '# Skills'
    ```
    """
    # pylint: disable=too-many-return-statements
    if key == "agents":
        return "\n" + comment(for_notebook, 2) + "Agents\n"
    if key == "imports":
        return "\n" + comment(for_notebook, 2) + "Imports\n"
    if key == "skills":
        return "\n" + comment(for_notebook, 2) + "Skills\n"
    if key == "models":
        return "\n" + comment(for_notebook, 2) + "Models\n"
    if key == "nested":
        return "\n" + comment(for_notebook, 2) + "Nested Chats\n"
    if key == "run":
        return "\n" + comment(for_notebook, 2) + "Run the flow\n"
    if key == "logging":
        return "\n" + comment(for_notebook, 2) + "Start Logging\n"
    return comment(for_notebook)
