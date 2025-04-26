# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Skills/tools related string generation functions.

Functions
---------
get_agent_skill_registration
    Get an agent's skill registration string.
export_skills
    Get the skills content and secrets.
"""

from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Union

from waldiez.models import WaldiezAgent, WaldiezSkill


def get_agent_skill_registration(
    caller_name: str,
    executor_name: str,
    skill_name: str,
    skill_description: str,
    string_escape: Callable[[str], str],
) -> str:
    r"""Get the agent skill string and secrets.

    Parameters
    ----------
    caller_name : str
        The name of the caller (agent).
    executor_name : str
        The name of the executor (agent).
    skill_name : str
        The name of the skill.
    skill_description : str
        The skill description.
    string_escape : Callable[[str], str]
        The string escape function.

    Returns
    -------
    str
        The agent skill string.

    Example
    -------
    ```python
    >>> get_agent_skill_registration(
    ...     caller_name="agent1",
    ...     executor_name="agent2",
    ...     skill_name="skill1",
    ...     skill_description="A skill that does something.",
    ...     string_escape=lambda x: x.replace('"', '\\"').replace("\\n", "\\n"),
    ... )
    register_function(
        skill1,
        caller=agent1,
        executor=agent2,
        name="skill1",
        description="A skill that does something.",
    )
    ```
    """
    skill_description = string_escape(skill_description)
    content = f"""register_function(
    {skill_name},
    caller={caller_name},
    executor={executor_name},
    name="{skill_name}",
    description="{skill_description}",
)
"""
    return content


def _write_skill_secrets(
    flow_name: str,
    skill: WaldiezSkill,
    skill_name: str,
    output_dir: Optional[Union[str, Path]],
) -> None:
    """Write the skill secrets to a file.

    Parameters
    ----------
    skill : WaldiezSkill
        The skill.
    skill_name : str
        The name of the skill.
    output_dir : Optional[Union[str, Path]]
        The output directory to save the secrets to.
    """
    if not skill.secrets or not output_dir:
        return
    if not isinstance(output_dir, Path):
        output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    secrets_file = output_dir / f"{flow_name}_{skill_name}_secrets.py"
    first_line = f'"""Secrets for the skill: {skill_name}."""' + "\n"
    with secrets_file.open("w", encoding="utf-8", newline="\n") as f:
        f.write(first_line)
        f.write("import os\n\n")
        for key, value in skill.secrets.items():
            f.write(f'os.environ["{key}"] = "{value}"' + "\n")


def export_skills(
    flow_name: str,
    skills: List[WaldiezSkill],
    skill_names: Dict[str, str],
    output_dir: Optional[Union[str, Path]] = None,
) -> Tuple[Tuple[List[str], List[str], List[str]], List[Tuple[str, str]], str]:
    """Get the skills' contents and secrets.

    If `output_dir` is provided, the contents are saved to that directory.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    skills : List[WaldiezSkill]
        The skills.
    skill_names : Dict[str, str]
        The skill names.
    output_dir : Optional[Union[str, Path]]
        The output directory to save the skills to.

    Returns
    -------
    Tuple[Tuple[List[str], List[str], List[str]], List[Tuple[str, str]], str]
        - The skill imports to use in the main file.
        - The skill secrets to set as environment variables.
        - The skills contents.
    """
    skill_imports: Tuple[List[str], List[str], List[str]] = ([], [], [])
    skill_secrets: List[Tuple[str, str]] = []
    skill_contents: str = ""
    # if the skill.is_shared,
    # its contents must be first (before the other skills)
    shared_skill_contents = ""
    for skill in skills:
        standard_skill_imports, third_party_skill_imports = skill.get_imports()
        if standard_skill_imports:
            skill_imports[0].extend(standard_skill_imports)
        if third_party_skill_imports:
            skill_imports[1].extend(third_party_skill_imports)
        secrets_import = get_skill_secrets_import(flow_name, skill)
        if secrets_import:
            skill_imports[2].append(secrets_import)
        for key, value in skill.secrets.items():
            skill_secrets.append((key, value))
        _write_skill_secrets(
            flow_name=flow_name,
            skill=skill,
            skill_name=skill_names[skill.id],
            output_dir=output_dir,
        )
        skill_content = skill.get_content()
        if not skill_content:
            continue
        if skill.is_shared:
            shared_skill_contents += skill_content + "\n\n"
        else:
            if skill.is_interop:
                skill_content += _add_interop_extras(
                    skill=skill, skill_names=skill_names
                )
            skill_contents += skill_content + "\n\n"
    skill_contents = shared_skill_contents + skill_contents
    # remove dupes from imports if any and sort them
    skill_imports = _sort_imports(skill_imports)
    return (
        skill_imports,
        skill_secrets,
        skill_contents.replace("\n\n\n", "\n\n"),
    )


def _add_interop_extras(
    skill: WaldiezSkill,
    skill_names: Dict[str, str],
) -> str:
    """Add the interop conversion.

    Parameters
    ----------
    skill : WaldiezSkill
        The skill
    skill_names : Dict[str, str]
        The skill names.

    Returns
    -------
    str
        The extra content to convert the tool.
    """
    skill_name = skill_names[skill.id]
    interop_instance = f"ag2_{skill_name}_interop = Interoperability()" + "\n"
    extra_content = (
        f"ag2_{skill_name} = "
        f"ag2_{skill_name}_interop.convert_tool("
        f"tool={skill_name}, "
        f'type="{skill.skill_type}")'
    )
    return "\n" + interop_instance + extra_content


def _sort_imports(
    skill_imports: Tuple[List[str], List[str], List[str]],
) -> Tuple[List[str], List[str], List[str]]:
    """Sort the imports.

    Parameters
    ----------
    skill_imports : Tuple[List[str], List[str], List[str]]
        The skill imports.

    Returns
    -------
    Tuple[List[str], List[str], List[str]]
        The sorted skill imports.
    """
    # "from x import y" and "import z"
    # the "import a" should be first (and sorted)
    # then the "from b import c" (and sorted)
    standard_lib_imports = skill_imports[0]
    third_party_imports = skill_imports[1]
    secrets_imports = skill_imports[2]

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


def get_skill_secrets_import(flow_name: str, skill: WaldiezSkill) -> str:
    """Get the skill secrets import string.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    skill : WaldiezSkill
        The skill.

    Returns
    -------
    str
        The skill imports string.
    """
    if not skill.secrets:
        return ""
        # fmt: on
    module_name = f"{flow_name}_{skill.name}"
    type_ignore_noqa = "  # type: ignore # noqa"
    return f"import {module_name}_secrets{type_ignore_noqa}" + "\n"


def get_agent_skill_registrations(
    agent: WaldiezAgent,
    agent_names: Dict[str, str],
    all_skills: List[WaldiezSkill],
    skill_names: Dict[str, str],
    string_escape: Callable[[str], str],
) -> str:
    r"""Get the agent skill registrations.

    example output:

    ```python
    >>> string_escape = lambda x: x.replace('"', '\\"').replace("\\n", "\\n")
    >>> agent = WaldiezAgent(
    ...     id="wa-1",
    ...     name="agent1",
    ...     description="An agent that does something.",
    ...     ...,
    ...     skills=[
    ...         WaldiezSkillLink(id="ws-1", executor_id="wa-2", ...),
    ...         WaldiezSkillLink(id="ws-2", executor_id="wa-3", ...),
    ...     ],
    ... )
    >>> agent_names = {"wa-1": "agent1", "wa-2": "agent2", "wa-3": "agent3"}
    >>> all_skills = [
    ...     WaldiezSkill(id="ws-1", ...),
    ...     WaldiezSkill(id="ws-2", ...),
    ...     WaldiezSkill(id="ws-3", ...),
    ... ]
    >>> skill_names = {"ws-1": "skill1", "ws-2": "skill2", "ws-3": "skill3"}
    >>> get_agent_skill_registrations(
    ...     agent=agent,
    ...     agent_names=agent_names,
    ...     all_skills=all_skills,
    ...     skill_names=skill_names,
    ...     string_escape=string_escape,
    ... )

    register_function(
        skill1,
        caller=agent1,
        executor=agent2,
        name="skill1",
        description="A skill that does something.",
    )
    register_function(
        skill2,
        caller=agent1,
        executor=agent3,
        name="skill2",
        description="A skill that does something.",
    )
    ```

    Parameters
    ----------
    agent : WaldiezAgent
        The agent.
    agent_names : Dict[str, str]
        A mapping of agent id to agent name.
    all_skills : List[WaldiezSkill]
        All the skills in the flow.
    skill_names : Dict[str, str]
        A mapping of skill id to skill name.
    string_escape : Callable[[str], str]
        The string escape function.

    Returns
    -------
    str
        The agent skill registrations.
    """
    if not agent.data.skills or not all_skills:
        return ""
    content = "\n"
    for linked_skill in agent.data.skills:
        waldiez_skill = next(
            skill for skill in all_skills if skill.id == linked_skill.id
        )
        skill_name = skill_names[linked_skill.id]
        if waldiez_skill.is_interop:
            # the name of the the converted to ag2 tool
            skill_name = f"ag2_{skill_name}"
        skill_description = (
            waldiez_skill.description or f"Description of {skill_name}"
        )
        caller_name = agent_names[agent.id]
        executor_name = agent_names[linked_skill.executor_id]
        content += (
            get_agent_skill_registration(
                caller_name=caller_name,
                executor_name=executor_name,
                skill_name=skill_name,
                skill_description=skill_description,
                string_escape=string_escape,
            )
            + "\n"
        )
    return content.replace("\n\n\n", "\n\n")
