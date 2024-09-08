"""Waldie Agent Skill Model."""

from pydantic import Field
from typing_extensions import Annotated

from ...common import WaldieBase


class WaldieAgentLinkedSkill(WaldieBase):
    """Waldie Agent Linked Skill.

    Attributes
    ----------
    id : str
        The id of the skill to use.
    executor_id: str
        The id of the agent to use that skill.
    """

    id: Annotated[
        str, Field(..., title="ID", description="The id of the skill to use.")
    ]
    executor_id: Annotated[
        str,
        Field(
            ...,
            title="Executor ID",
            description="The id of the agent to use that skill.",
        ),
    ]
