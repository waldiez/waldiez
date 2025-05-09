# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Tools related string generation functions.

Functions
---------
get_agent_tool_registration
    Get an agent's tool registration string.
export_tools
    Get the tools content and secrets.
"""

from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Union

from waldiez.models import WaldiezAgent, WaldiezTool


def get_agent_tool_registration(
    caller_name: str,
    executor_name: str,
    tool_name: str,
    tool_description: str,
    string_escape: Callable[[str], str],
) -> str:
    r"""Get the agent tool string and secrets.

    Parameters
    ----------
    caller_name : str
        The name of the caller (agent).
    executor_name : str
        The name of the executor (agent).
    tool_name : str
        The name of the tool.
    tool_description : str
        The tool description.
    string_escape : Callable[[str], str]
        The string escape function.

    Returns
    -------
    str
        The agent tool string.

    Example
    -------
    ```python
    >>> get_agent_tool_registration(
    ...     caller_name="agent1",
    ...     executor_name="agent2",
    ...     tool_name="tool1",
    ...     tool_description="A tool that does something.",
    ...     string_escape=lambda x: x.replace('"', '\\"').replace("\\n", "\\n"),
    ... )
    register_function(
        tool1,
        caller=agent1,
        executor=agent2,
        name="tool1",
        description="A tool that does something.",
    )
    ```
    """
    tool_description = string_escape(tool_description)
    content = f"""register_function(
    {tool_name},
    caller={caller_name},
    executor={executor_name},
    name="{tool_name}",
    description="{tool_description}",
)
"""
    return content


def _write_tool_secrets(
    flow_name: str,
    tool: WaldiezTool,
    tool_name: str,
    output_dir: Optional[Union[str, Path]],
) -> None:
    """Write the tool secrets to a file.

    Parameters
    ----------
    tool : WaldiezTool
        The tool.
    tool_name : str
        The name of the tool.
    output_dir : Optional[Union[str, Path]]
        The output directory to save the secrets to.
    """
    if not tool.secrets or not output_dir:
        return
    if not isinstance(output_dir, Path):
        output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    secrets_file = output_dir / f"{flow_name}_{tool_name}_secrets.py"
    first_line = f'"""Secrets for the tool: {tool_name}."""' + "\n"
    with secrets_file.open("w", encoding="utf-8", newline="\n") as f:
        f.write(first_line)
        f.write("import os\n\n")
        for key, value in tool.secrets.items():
            f.write(f'os.environ["{key}"] = "{value}"' + "\n")


def export_tools(
    flow_name: str,
    tools: List[WaldiezTool],
    tool_names: Dict[str, str],
    output_dir: Optional[Union[str, Path]] = None,
) -> Tuple[Tuple[List[str], List[str], List[str]], List[Tuple[str, str]], str]:
    """Get the tools' contents and secrets.

    If `output_dir` is provided, the contents are saved to that directory.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    tools : List[WaldiezTool]
        The tools.
    tool_names : Dict[str, str]
        The tool names.
    output_dir : Optional[Union[str, Path]]
        The output directory to save the tools to.

    Returns
    -------
    Tuple[Tuple[List[str], List[str], List[str]], List[Tuple[str, str]], str]
        - The tool imports to use in the main file.
        - The tool secrets to set as environment variables.
        - The tools contents.
    """
    tool_imports: Tuple[List[str], List[str], List[str]] = ([], [], [])
    tool_secrets: List[Tuple[str, str]] = []
    tool_contents: str = ""
    # if the tool.is_shared,
    # its contents must be first (before the other tools)
    shared_tool_contents = ""
    for tool in tools:
        standard_tool_imports, third_party_tool_imports = tool.get_imports()
        if standard_tool_imports:
            tool_imports[0].extend(standard_tool_imports)
        if third_party_tool_imports:
            tool_imports[1].extend(third_party_tool_imports)
        secrets_import = get_tool_secrets_import(flow_name, tool)
        if secrets_import:
            tool_imports[2].append(secrets_import)
        for key, value in tool.secrets.items():
            tool_secrets.append((key, value))
        _write_tool_secrets(
            flow_name=flow_name,
            tool=tool,
            tool_name=tool_names[tool.id],
            output_dir=output_dir,
        )
        tool_content = tool.get_content()
        if not tool_content:
            continue
        if tool.is_shared:
            shared_tool_contents += tool_content + "\n\n"
        else:
            if tool.is_interop:
                tool_content += _add_interop_extras(
                    tool=tool, tool_names=tool_names
                )
            tool_contents += tool_content + "\n\n"
    tool_contents = shared_tool_contents + tool_contents
    # remove dupes from imports if any and sort them
    tool_imports = _sort_imports(tool_imports)
    return (
        tool_imports,
        tool_secrets,
        tool_contents.replace("\n\n\n", "\n\n"),
    )


def _add_interop_extras(
    tool: WaldiezTool,
    tool_names: Dict[str, str],
) -> str:
    """Add the interop conversion.

    Parameters
    ----------
    tool : WaldiezTool
        The tool
    tool_names : Dict[str, str]
        The tool names.

    Returns
    -------
    str
        The extra content to convert the tool.
    """
    tool_name = tool_names[tool.id]
    interop_instance = f"ag2_{tool_name}_interop = Interoperability()" + "\n"
    extra_content = (
        f"ag2_{tool_name} = "
        f"ag2_{tool_name}_interop.convert_tool("
        f"tool={tool_name}, "
        f'type="{tool.tool_type}")'
    )
    return "\n" + interop_instance + extra_content


def _sort_imports(
    tool_imports: Tuple[List[str], List[str], List[str]],
) -> Tuple[List[str], List[str], List[str]]:
    """Sort the imports.

    Parameters
    ----------
    tool_imports : Tuple[List[str], List[str], List[str]]
        The tool imports.

    Returns
    -------
    Tuple[List[str], List[str], List[str]]
        The sorted tool imports.
    """
    # "from x import y" and "import z"
    # the "import a" should be first (and sorted)
    # then the "from b import c" (and sorted)
    standard_lib_imports = tool_imports[0]
    third_party_imports = tool_imports[1]
    secrets_imports = tool_imports[2]

    sorted_standard_lib_imports = sorted(
        [imp for imp in standard_lib_imports if imp.startswith("import ")]
    ) + sorted([imp for imp in standard_lib_imports if imp.startswith("from ")])

    sorted_third_party_imports = sorted(
        [imp for imp in third_party_imports if imp.startswith("import ")]
    ) + sorted([imp for imp in third_party_imports if imp.startswith("from ")])

    sorted_secrets_imports = sorted(secrets_imports)

    return (
        sorted_standard_lib_imports,
        sorted_third_party_imports,
        sorted_secrets_imports,
    )


def get_tool_secrets_import(flow_name: str, tool: WaldiezTool) -> str:
    """Get the tool secrets import string.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    tool : WaldiezTool
        The tool.

    Returns
    -------
    str
        The tool imports string.
    """
    if not tool.secrets:
        return ""
        # fmt: on
    module_name = f"{flow_name}_{tool.name}"
    type_ignore_noqa = "  # type: ignore # noqa"
    return f"import {module_name}_secrets{type_ignore_noqa}" + "\n"


def get_agent_tool_registrations(
    agent: WaldiezAgent,
    agent_names: Dict[str, str],
    all_tools: List[WaldiezTool],
    tool_names: Dict[str, str],
    string_escape: Callable[[str], str],
) -> str:
    r"""Get the agent tool registrations.

    example output:

    ```python
    >>> string_escape = lambda x: x.replace('"', '\\"').replace("\\n", "\\n")
    >>> agent = WaldiezAgent(
    ...     id="wa-1",
    ...     name="agent1",
    ...     description="An agent that does something.",
    ...     ...,
    ...     tools=[
    ...         WaldiezToolLink(id="ws-1", executor_id="wa-2", ...),
    ...         WaldiezToolLink(id="ws-2", executor_id="wa-3", ...),
    ...     ],
    ... )
    >>> agent_names = {"wa-1": "agent1", "wa-2": "agent2", "wa-3": "agent3"}
    >>> all_tools = [
    ...     WaldiezTool(id="ws-1", ...),
    ...     WaldiezTool(id="ws-2", ...),
    ...     WaldiezTool(id="ws-3", ...),
    ... ]
    >>> tool_names = {"ws-1": "tool1", "ws-2": "tool2", "ws-3": "tool3"}
    >>> get_agent_tool_registrations(
    ...     agent=agent,
    ...     agent_names=agent_names,
    ...     all_tools=all_tools,
    ...     tool_names=tool_names,
    ...     string_escape=string_escape,
    ... )

    register_function(
        tool1,
        caller=agent1,
        executor=agent2,
        name="tool1",
        description="A tool that does something.",
    )
    register_function(
        tool2,
        caller=agent1,
        executor=agent3,
        name="tool2",
        description="A tool that does something.",
    )
    ```

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    all_tools : List[WaldiezTool]
        All the tools in the flow.
    tool_names : Dict[str, str]
        A mapping of tool id to tool name.
    string_escape : Callable[[str], str]
        The string escape function.

    Returns
    -------
    str
        The agent tool registrations.
    """
    if not agent.data.tools or not all_tools:
        return ""
    content = "\n"
    for linked_tool in agent.data.tools:
        waldiez_tool = next(
            tool for tool in all_tools if tool.id == linked_tool.id
        )
        tool_name = tool_names[linked_tool.id]
        if waldiez_tool.is_interop:
            # the name of the the converted to ag2 tool
            tool_name = f"ag2_{tool_name}"
        tool_description = (
            waldiez_tool.description or f"Description of {tool_name}"
        )
        caller_name = agent_names[agent.id]
        executor_name = agent_names[linked_tool.executor_id]
        content += (
            get_agent_tool_registration(
                caller_name=caller_name,
                executor_name=executor_name,
                tool_name=tool_name,
                tool_description=tool_description,
                string_escape=string_escape,
            )
            + "\n"
        )
    return content.replace("\n\n\n", "\n\n")
