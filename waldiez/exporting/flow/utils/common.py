# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# flake8: noqa: E501
"""Common utils for the final generatio."""

from pathlib import Path

from waldiez.models import Waldiez

from ...core import FILE_HEADER
from .linting import (
    get_flake8_ignore_comment,
    get_mypy_ignore_comment,
    get_pylint_ignore_comment,
    get_pyright_ignore_comment,
)

RETURN_TYPE_HINT = "Union[ChatResult, list[ChatResult], dict[int, ChatResult]]"
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
    return f'''"""Start chatting.

    Returns
    -------
    {RETURN_TYPE_HINT}
        The result of the chat session, which can be a single ChatResult,
        a list of ChatResults, or a dictionary mapping integers to ChatResults.
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


def get_set_io_stream(
    use_structured_io: bool,
    is_async: bool,
    uploads_root: Path | None,
) -> str:
    """Get the content to set structured IO.

    Parameters
    ----------
    use_structured_io : bool
        Whether to use structured IO or not.
    is_async : bool
        Whether the flow is async or not.
    uploads_root : Path | None
        The uploads root, to get user-uploaded files, by default None.

    Returns
    -------
    str
        The content to set structured IO.
    """
    if use_structured_io:
        return get_set_structured_io_stream(is_async, uploads_root)
    return get_patch_default_io_stream(is_async)


def get_set_structured_io_stream(
    is_async: bool,
    uploads_root: Path | None,
) -> str:
    """Get the content to set structured IO.

    Parameters
    ----------
    is_async : bool
        Whether the flow is async or not.
    uploads_root : Path | None
        The uploads root, to get user-uploaded files, by default None.

    Returns
    -------
    str
        The content to set structured IO.
    """
    upload_root_arg = f'r"{uploads_root}"' if uploads_root else "None"
    return f"""
# set structured IO
from autogen.io import IOStream
from waldiez.io import StructuredIOStream
stream = StructuredIOStream(
    is_async={is_async},
    uploads_root={upload_root_arg}
)
IOStream.set_default(stream)
"""


def get_patch_default_io_stream(is_async: bool) -> str:
    """Get the content to patch the default IO stream.

    Parameters
    ----------
    is_async : bool
        Whether the flow is async or not.

    Returns
    -------
    str
        The content to patch the default IO stream.
    """
    # copy from waldiez/running/patch_io_stream.py
    return f"""
# patch the default IOStream
# pylint: disable=import-outside-toplevel
from waldiez.running.patch_io_stream import patch_io_stream
patch_io_stream(is_async={is_async})
"""
