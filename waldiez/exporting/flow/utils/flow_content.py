# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
# pylint: disable=line-too-long
"""Utils to generate the content of a flow."""

from typing import Callable, Optional

from waldiez.models import Waldiez


def get_py_content_start(waldiez: Waldiez) -> str:
    """Get the first part of the python script.

    Parameters
    ----------
    waldiez : Waldiez
        The waldiez object.

    Returns
    -------
    str
        The first part of the python script.
    """
    content = "#!/usr/bin/env python\n"
    content += "# flake8: noqa: E501\n"
    content += get_pylint_ignore_comment(False)
    content += get_pyright_ignore_comment(False)
    content += "# cspell: disable\n"
    content += f'"""{waldiez.name}.' + "\n\n"
    content += f"{waldiez.description}" + "\n\n"
    tags = ", ".join(waldiez.tags)
    content += f"Tags: {tags}" + "\n\n"
    requirements = " ".join(waldiez.requirements)
    content += f"Requirements: {requirements}" + "\n\n"
    content += '"""\n\n'
    return content


def get_ipynb_content_start(
    waldiez: Waldiez, comment: Callable[[bool, int], str]
) -> str:
    """Get the first part of the ipynb file.

    Parameters
    ----------
    waldiez : Waldiez
        The waldiez object.
    comment : Callable[[bool, int], str]
        The function to create a comment.

    Returns
    -------
    str
        The first part of the ipynb file.
    """
    content = f"{comment(True, 1)}{waldiez.name}." + "\n\n"
    content += f"{comment(True, 2)}{waldiez.description}" + "\n\n"
    content += f"{comment(True, 2)}Dependencies" + "\n\n"
    content += "import sys\n"
    requirements = " ".join(waldiez.requirements)
    if requirements:
        # fmt: off
        content += "# " + f"!{{sys.executable}} -m pip install -q {requirements}" + "\n"
        # fmt: on
    content += "# flake8: noqa: E501"
    content += get_pylint_ignore_comment(True)
    content += get_pyright_ignore_comment(True)
    content += "# cspell: disable\n"
    return content


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
    notebook: bool, rules: Optional[list[str]] = None
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


def get_pyright_ignore_comment(
    notebook: bool, rules: Optional[list[str]] = None
) -> str:
    """Get the pyright ignore comment string.

    Parameters
    ----------
    notebook : bool
        Whether the comment is for a notebook.
    rules : Optional[list[str]], optional
        The pyright rules to ignore, by default None.

    Returns
    -------
    str
        The pyright ignore comment string.

    Example
    -------
    ```python
    >>> get_pyright_ignore_comment(True, ["reportUnusedImport", "reportMissingTypeStubs"])

    # pyright: reportUnusedImport=false, reportMissingTypeStubs=false
    ```
    """
    if not rules:
        rules = PYRIGHT_RULES
    line = "# pyright: " + ",".join([f"{rule}=false" for rule in rules])
    if notebook is True:
        line = "\n" + line
    return line + "\n"


def get_after_run_content(
    waldiez: Waldiez,
    agent_names: dict[str, str],
    tabs: int,
) -> str:
    """Get content to add after the flow is run.

    Parameters
    ----------
    waldiez : Waldiez
        The waldiez object.
    agent_names : dict[str, str]
        The dictionary of agent names and their corresponding ids
    tabs : int
        The number of tabs to add before the content.

    Returns
    -------
    str
        The content to add after the flow is run.
    """
    # if the flow has a reasoning agents, we add
    # agent.visualize_tree() for each agent
    content = ""
    tab = "    "
    space = tab * tabs
    for agent in waldiez.agents:
        if agent.agent_type == "reasoning":
            agent_name = agent_names[agent.id]
            content += f"""
{space}# pylint: disable=broad-except,too-many-try-statements
{space}try:
{space}{tab}{agent_name}.visualize_tree()
{space}{tab}if os.path.exists("tree_of_thoughts.png"):
{space}{tab}{tab}new_name = "{agent_name}_tree_of_thoughts.png"
{space}{tab}{tab}os.rename("tree_of_thoughts.png", new_name)
{space}except BaseException:
{space}{tab}pass
{space}# save the tree to json
{space}try:
{space}{tab}data = {agent_name}._root.to_dict()  # pylint: disable=protected-access  # pyright: ignore
{space}{tab}with open("{agent_name}_reasoning_tree.json", "w", encoding="utf-8") as f:
{space}{tab}{tab}json.dump(data, f)
{space}except BaseException:
{space}{tab}pass
"""
    return content


def get_np_no_nep50_handle() -> str:
    """Handle catching the "module numpy has no attribute _no_pep50_warning" error.

    Returns
    -------
    str
        The content to handle the error.
    """
    # https://github.com/numpy/numpy/blob/v2.2.2/\
    #   doc/source/release/2.2.0-notes.rst#nep-50-promotion-state-option-removed
    content = '''
# try to make sure we don't get:
# module 'numpy' has no attribute '_no_nep50_warning'"
os.environ["NEP50_DEPRECATION_WARNING"] = "0"
os.environ["NEP50_DISABLE_WARNING"] = "1"
os.environ["NPY_PROMOTION_STATE"] = "weak"
if not hasattr(np, "_no_pep50_warning"):

    import contextlib
    from typing import Generator

    @contextlib.contextmanager
    def _np_no_nep50_warning() -> Generator[None, None, None]:
        """Dummy function to avoid the warning.

        Yields
        ------
        None
            Nothing.
        """
        yield
    setattr(np, "_no_pep50_warning", _np_no_nep50_warning)  # noqa
'''
    return content
