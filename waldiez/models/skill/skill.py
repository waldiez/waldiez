# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez Skill model."""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple, Union

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ..common import (
    WaldiezBase,
    gather_code_imports,
    get_function,
    now,
    parse_code_string,
)
from .skill_data import WaldiezSkillData
from .skill_type import WaldiezSkillType

SHARED_SKILL_NAME = "waldiez_shared"


class WaldiezSkill(WaldiezBase):
    """Waldiez Skill.

    Attributes
    ----------
    id : str
        The ID of the skill.
    type : Literal["skill"]
        The type of the "node" in a graph: "skill".
    name : str
        The name of the skill.
    description : str
        The description of the skill.
    tags : List[str]
        The tags of the skill.
    requirements : List[str]
        The requirements of the skill.
    created_at : str
        The date and time when the skill was created.
    updated_at : str
        The date and time when the skill was last updated.
    data : WaldiezSkillData
        The data of the skill. See `WaldiezSkillData`.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The ID of the skill.")
    ]
    type: Annotated[
        Literal["skill"],
        Field(
            default="skill",
            title="Type",
            description="The type of the 'node' in a graph.",
        ),
    ]
    name: Annotated[
        str, Field(..., title="Name", description="The name of the skill.")
    ]
    description: Annotated[
        str,
        Field(
            ...,
            title="Description",
            description="The description of the skill.",
        ),
    ]
    tags: Annotated[
        List[str],
        Field(
            title="Tags",
            description="The tags of the skill.",
            default_factory=list,
        ),
    ]
    requirements: Annotated[
        List[str],
        Field(
            title="Requirements",
            description="The requirements of the skill.",
            default_factory=list,
        ),
    ]
    data: Annotated[
        WaldiezSkillData,
        Field(..., title="Data", description="The data of the skill."),
    ]
    created_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Created At",
            description="The date and time when the skill was created.",
        ),
    ]
    updated_at: Annotated[
        str,
        Field(
            default_factory=now,
            title="Updated At",
            description="The date and time when the skill was last updated.",
        ),
    ]

    @staticmethod
    def load(data_or_path: Union[str, Path, Dict[str, Any]]) -> "WaldiezSkill":
        """Load a skill from a read-only file.

        Parameters
        ----------
        data_or_path : Union[str, Path, Dict[str, Any]]
            The path to the read-only file or the loaded data.

        Returns
        -------
        WaldiezSkill
            The skill.

        Raises
        ------
        FileNotFoundError
            If the file is not found.
        ValueError
            If the JSON is invalid or the data is invalid.
        """
        if isinstance(data_or_path, dict):
            return WaldiezSkill.model_validate(data_or_path)
        if not isinstance(data_or_path, Path):
            data_or_path = Path(data_or_path)
        resolved = data_or_path.resolve()
        if not resolved.is_file():
            raise FileNotFoundError(f"File not found: {resolved}")
        with resolved.open("r", encoding="utf-8") as file:
            data_string = file.read()
            try:
                data_dict = json.loads(data_string)
            except BaseException as exc:  # pylint: disable=broad-except
                raise ValueError(f"Invalid WaldiezSkill/JSON: {exc}") from exc
            return WaldiezSkill.model_validate(data_dict)

    @property
    def skill_type(self) -> WaldiezSkillType:
        """Get the skill type.

        Returns
        -------
        WaldiezSkillType
            The type of the skill:
            [shared, custom, langchain, crewai].
        """
        return self.data.skill_type

    _skill_imports: Tuple[List[str], List[str]] = ([], [])

    def get_imports(self) -> Tuple[List[str], List[str]]:
        """Get the skill imports.

        Returns
        -------
        Tuple[List[str], List[str]]
            The builtin and external imports.
        """
        return self._skill_imports

    @property
    def is_shared(self) -> bool:
        """Check if the skill is shared.

        Returns
        -------
        bool
            True if the skill is shared, False otherwise.
        """
        return self.skill_type == "shared" or self.name == SHARED_SKILL_NAME

    @property
    def is_interop(self) -> bool:
        """Check if the skill is interoperability.

        Returns
        -------
        bool
            True if the skill is interoperability, False otherwise.
        """
        return self.skill_type in ("langchain", "crewai")

    def get_content(self) -> str:
        """Get the content of the skill.

        Returns
        -------
        str
            The content of the skill.
        """
        if self.is_shared or self.is_interop:
            return self.data.content
        # if custom, only the function content
        return get_function(self.data.content, self.name)

    def _validate_interop_skill(self) -> None:
        """Validate the interoperability skill.

        Raises
        ------
        ValueError
            If the skill name is not in the content.
        """
        if self.is_interop:
            # we expect sth like:
            # with single or double quotes for type={skill_type}
            # {skill_name} = *.convert_tool(..., type="{skill_type}", ...)
            if f"{self.name} = " not in self.data.content:
                raise ValueError(
                    f"The skill name '{self.name}' is not in the content."
                )
            # we don't want the conversion to ag2 tool (we do it internally)
            # or the skill registration (we do it after having the agent names)
            # so no" .convert_tool(... type="...")
            # or .register_for_llm(...), .register_for_execution(...)
            to_exclude = [
                r".convert_tool\(.+?type=",
                rf"{self.name}.register_for_llm\(",
                rf"{self.name}.register_for_execution\(",
            ]
            for exclude in to_exclude:
                if re.search(exclude, self.data.content):
                    raise ValueError(
                        f"Invalid skill content: '{exclude}' is not allowed."
                    )

    def _validate_custom_skill(self) -> None:
        """Validate a custom skill.

        Raises
        ------
        ValueError
            If the skill name is not in the content.
            If the skill content is invalid.
        """
        search = f"def {self.name}("
        if self.skill_type == "custom" and not self.is_shared:
            if search not in self.data.content:
                raise ValueError(
                    f"The skill name '{self.name}' is not in the content."
                )
            error, tree = parse_code_string(self.data.content)
            if error is not None or tree is None:
                raise ValueError(f"Invalid skill content: {error}")

    @model_validator(mode="after")
    def validate_data(self) -> Self:
        """Validate the data.

        Returns
        -------
        WaldiezSkill
            The skill.

        Raises
        ------
        ValueError
            If the skill name is not in the content.
            If the skill content is invalid.
        """
        self._validate_custom_skill()
        self._validate_interop_skill()
        self._skill_imports = gather_code_imports(
            self.data.content, self.is_interop
        )
        # remove the imports from the content
        # we 'll place them at the top of the file
        all_imports = self._skill_imports[0] + self._skill_imports[1]
        code_lines = self.data.content.splitlines()
        valid_lines = [
            line
            for line in code_lines
            if not any(line.startswith(imp) for imp in all_imports)
        ]
        # remove empty lines at the beginning and end
        # of the content
        while valid_lines and not valid_lines[0].strip():
            valid_lines.pop(0)
        while valid_lines and not valid_lines[-1].strip():
            valid_lines.pop()
        self.data.content = "\n".join(valid_lines)
        return self

    @property
    def content(self) -> str:
        """Get the content (source) of the skill."""
        return self.data.content

    @property
    def secrets(self) -> Dict[str, str]:
        """Get the secrets (environment variables) of the skill."""
        return self.data.secrets or {}
