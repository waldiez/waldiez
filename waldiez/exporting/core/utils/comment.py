# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Get comment string for scripts or notebooks."""


def get_comment(
    comment: str,
    for_notebook: bool = False,
    md_headings: int = 3,
) -> str:
    """Get a comment for the script or notebook.

    Parameters
    ----------
    comment : str
        The comment to add.
    for_notebook : bool, optional
        Whether the comment is for a notebook, by default False
    md_headings : int, optional
        The number of markdown headings to use (if for_notebook is True),
        by default 2

    Returns
    -------
    str
        The formatted comment.
    """
    if for_notebook:
        # For notebooks, we use markdown headings
        heading = "#" + "#" * md_headings
        return f"# %% [markdown]\n{heading} {comment}\n# %% \n"
    # For scripts, we use a simple comment
    return f"# {comment}\n"
