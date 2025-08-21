# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Common utils for the final flow generation."""

from waldiez.models import Waldiez

from ...core import FILE_HEADER
from .linting import (
    get_flake8_ignore_comment,
    get_mypy_ignore_comment,
    get_pylint_ignore_comment,
    get_pyright_ignore_comment,
)

GENERATED_WITH = "🧩 generated with ❤️ by Waldiez."


def generate_header(
    name: str,
    description: str,
    requirements: list[str],
    tags: list[str],
    for_notebook: bool,
) -> str:
    """Generate the header for the script or notebook.

    Parameters
    ----------
    name : str
        The name of the flow.
    description : str
        A brief description of the flow.
    requirements : list[str]
        A list of requirements for the flow.
    tags : list[str]
        A list of tags associated with the flow.
    for_notebook : bool
        Whether the header is for a notebook or a script.

    Returns
    -------
    str
        The header content.
    """
    if not for_notebook:
        return _get_py_header(
            name=name,
            description=description,
            requirements=requirements,
            tags=tags,
        )
    return _get_ipynb_heeader(
        name=name,
        description=description,
        requirements=requirements,
        tags=tags,
    )


def _get_ipynb_heeader(
    name: str,
    description: str,
    requirements: list[str],
    tags: list[str],
) -> str:
    requirements_str = " ".join(requirements)
    tags_str = ", ".join(tags)
    content = "# %% [markdown]\n"
    content += f"## Name: {name}\n\n"
    content += f"### Description: {description}\n\n"
    content += f"### Tags: {tags_str}\n\n"
    content += f"####{GENERATED_WITH}\n\n"
    content += "#### Requirements\n\n# %%\n"
    content += "import sys  # pyright: ignore\n"
    # fmt: off
    content += "# # " + f"!{{sys.executable}} -m pip install -q {requirements_str}" + "\n"
    # fmt: on
    return content


def _get_py_header(
    name: str,
    description: str,
    requirements: list[str],
    tags: list[str],
) -> str:
    return f'''#!/usr/bin/env python
{FILE_HEADER}
{get_flake8_ignore_comment()}
{get_pylint_ignore_comment()}
{get_mypy_ignore_comment([])}
{get_pyright_ignore_comment()}
"""{name}.

{description}

Requirements: {", ".join(requirements)}
Tags: {", ".join(tags)}
{GENERATED_WITH}
"""'''


def main_doc_string() -> str:
    """Generate the docstring for the main function.

    Returns
    -------
    str
        The docstring for the main function.
    """
    return_type_hint = "list[dict[str, Any]]"
    return f'''"""Start chatting.

    Returns
    -------
    {return_type_hint}
        The result of the chat session.

    Raises
    ------
    SystemExit
        If the user interrupts the chat session.
    """'''


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
        if agent.is_reasoning:
            agent_name = agent_names[agent.id]
            content += f"""
{space}# pylint: disable=broad-exception-caught,too-many-try-statements
{space}try:
{space}{tab}{agent_name}.visualize_tree()
{space}{tab}if os.path.exists("tree_of_thoughts.png"):
{space}{tab}{tab}new_name = "{agent_name}_tree_of_thoughts.png"
{space}{tab}{tab}os.rename("tree_of_thoughts.png", new_name)
{space}except BaseException:
{space}{tab}pass
{space}# save the tree to json
{space}# pylint: disable=protected-access
{space}try:
{space}{tab}data = {agent_name}._root.to_dict()  # pyright: ignore
{space}{tab}with open("{agent_name}_reasoning_tree.json", "w", encoding="utf-8") as f:
{space}{tab}{tab}json.dump(data, f)
{space}except BaseException:
{space}{tab}pass
"""
    return content


def get_common_env_var_setup() -> str:
    """Get common environment variable setup for Waldiez flows.

    Returns
    -------
    str
        The content to set up common environment variables.
    """
    content = """
# Common environment variable setup for Waldiez flows
load_dotenv(override=True)
os.environ["AUTOGEN_USE_DOCKER"] = "0"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
"""
    return content


def get_np_no_nep50_handle() -> str:
    """Handle the "module numpy has no attribute _no_pep50_warning" error.

    Returns
    -------
    str
        The content to handle the error.
    """
    content = '''
#
# let's try to avoid:
# module 'numpy' has no attribute '_no_nep50_warning'"
# ref: https://github.com/numpy/numpy/blob/v2.2.2/doc/source/release/2.2.0-notes.rst#nep-50-promotion-state-option-removed
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
