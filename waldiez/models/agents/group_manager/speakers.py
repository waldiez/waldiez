# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Group chat speakers."""

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function

WaldiezGroupManagerSpeakersSelectionMethod = Literal[
    "auto",
    "manual",
    "random",
    "round_robin",
    "default",
    "custom",
]
"""Possible methods for the speaker selection."""
WaldiezGroupManagerSpeakersSelectionMode = Literal["repeat", "transition"]
"""Possible selection modes: repeat, transition."""
WaldiezGroupManagerSpeakersTransitionsType = Literal["allowed", "disallowed"]
"""Possible transitions types: allowed, disallowed."""

CUSTOM_SPEAKER_SELECTION = "custom_speaker_selection"
CUSTOM_SPEAKER_SELECTION_ARGS = ["last_speaker", "groupchat"]
CUSTOM_SPEAKER_SELECTION_TYPES = (
    ["ConversableAgent", "GroupChat"],
    "Optional[Union[Agent, str]]",
)


class WaldiezGroupManagerSpeakers(WaldiezBase):
    r"""Group chat speakers.

    If the method for the speaker selection is `custom`
    the `selection_custom_method` contents (source code) will be used.
    The method must be called `custom_speaker_selection`,
    have two arguments:

    - last_speaker: `autogen.ConversableAgent`
    - groupchat: `autogen.GroupChat`

    and return a `Union[Agent, str, None]`

    Example
    -------
    ```python
    {
        "selectionMethod": "custom",
        "selectionCustomMethod": (
            "def custom_speaker_selection(last_speaker, groupchat):\\n"
            "    return last_speaker"
        ),
        ...
    }
    ```

    Attributes
    ----------
    selection_method : WaldiezGroupManagerSpeakersSelectionMethod
        The next speaker selection method.
    selection_custom_method : str | None
        Method for custom selection.
    max_retries_for_selecting : Optional[int]
        Max retries for selecting a speaker.
    selection_mode : WaldiezGroupManagerSpeakersSelectionMode
        Selection mode.
    allow_repeat : Union[bool, list[str]]
        Allow repeat.
    allowed_or_disallowed_transitions : dict[str, list[str]]
        Allowed or disallowed transitions.
    transitions_type : WaldiezGroupManagerSpeakersTransitionsType
        The type of transition rules to use if
        if a mapping (agent => list[agents]) is used:
        `allowed` (default) or `disallowed`
    """

    selection_method: Annotated[
        WaldiezGroupManagerSpeakersSelectionMethod,
        Field(
            default="auto",
            title="Selection Method",
            description="The next speaker selection method",
            alias="selectionMethod",
        ),
    ]
    selection_custom_method: Annotated[
        str | None,
        Field(
            default=None,
            title="Method for custom selection.",
            description=(
                "If the method for the speaker selection if `custom`"
                "These contents (source code) will be used. "
                "The method must be called `custom_speaker_selection`, "
                "have two arguments: "
                "   - last_speaker: `autogen.ConversableAgent`"
                "   - groupchat: `autogen.GroupChat`"
                "and return a `Union[Agent, str, None]`"
            ),
            alias="selectionCustomMethod",
        ),
    ]
    max_retries_for_selecting: Annotated[
        int | None,
        Field(
            default=None,
            title="Max retries for a selecting",
            description=(
                "The maximum number of retries for the group manager "
                "for selecting the next speaker. Default: None (no limit)"
            ),
            alias="maxRetriesForSelecting",
        ),
    ]
    selection_mode: Annotated[
        WaldiezGroupManagerSpeakersSelectionMode,
        Field(
            default="repeat",
            title="Selection Mode",
            description=(
                "The method to use for selecting a next speaker: "
                "Either using the speaker repetition or "
                "the speaker transition rules"
            ),
            alias="selectionMode",
        ),
    ]
    allow_repeat: Annotated[
        bool | list[str] | None,
        Field(
            default=True,
            title="Allow repeat",
            description=(
                "The speakers' repetition mode: "
                "Either a bool, or a list with agents to be allowed."
            ),
            alias="allowRepeat",
        ),
    ]
    allowed_or_disallowed_transitions: Annotated[
        dict[str, list[str]],
        Field(
            default_factory=dict,
            title="Allowed or disallowed transitions",
            description=(
                "A mapping (agent.id => list[agent.ids])"
                "with the allowed or disallowed transitions."
            ),
            alias="allowedOrDisallowedTransitions",
        ),
    ]
    transitions_type: Annotated[
        WaldiezGroupManagerSpeakersTransitionsType,
        Field(
            default="allowed",
            title="Transitions type",
            description=(
                "The type of transition rules to use if "
                "if a mapping (agent => list[agents]) is used: "
                "`allowed` (default) or `disallowed`"
            ),
            alias="transitionsType",
        ),
    ]
    order: Annotated[
        list[str],
        Field(
            default_factory=list,
            title="Order",
            description=(
                "The order of the speakers in the group "
                "(if round_robin is used). If empty, the order  "
                "will be determined by the order of the agents in the flow."
            ),
        ),
    ]
    _custom_method_string: str | None = None
    _order: list[str] | None = None

    @property
    def custom_method_string(self) -> str | None:
        """Get the custom method string.

        Returns
        -------
        str
            The custom method string.
        """
        return self._custom_method_string

    def get_custom_method_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Get the custom method function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The custom method function and the function name.
        """
        function_name = CUSTOM_SPEAKER_SELECTION
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=CUSTOM_SPEAKER_SELECTION_ARGS,
                function_types=CUSTOM_SPEAKER_SELECTION_TYPES,
                function_body=self.custom_method_string or "",
            ),
            function_name,
        )

    def get_order(self) -> list[str]:
        """Get the order of the speakers.

        Returns
        -------
        list[str]
            The order of the speakers.

        Raises
        ------
        RuntimeError
            If the order is not set.
        """
        if self._order is None:
            raise RuntimeError("Order is not set. Call `set_order` first.")
        return self._order

    def set_order(
        self, initial_agent_id: str, group_members: list[str]
    ) -> None:
        """Generate the order of the speakers.

        Parameters
        ----------
        initial_agent_id : str
            The ID of the initial agent.
        group_members : list[str]
            The group members' IDs.
        """
        # make sure all the members are in the order
        # also make sure the initial agent is first
        order_copy = self.order.copy() if self.order else []
        all_members = [initial_agent_id] + [
            member for member in order_copy if member != initial_agent_id
        ]
        for member in group_members:
            if member not in all_members:
                all_members.append(member)
        self._order = all_members

    @model_validator(mode="after")
    def validate_group_speakers_config(self) -> Self:
        """Validate the speakers config.

        Returns
        -------
        GroupManagerSpeakers
            The group manager speakers config.

        Raises
        ------
        ValueError
            If the custom method is invalid.
        """
        if self.selection_method == "custom":
            if not self.selection_custom_method:
                raise ValueError("No custom method provided.")
            is_valid, error_or_body = check_function(
                code_string=self.selection_custom_method,
                function_name=CUSTOM_SPEAKER_SELECTION,
                function_args=CUSTOM_SPEAKER_SELECTION_ARGS,
            )
            if not is_valid or not error_or_body:
                # pylint: disable=inconsistent-quotes
                raise ValueError(
                    f"Invalid custom method: {error_or_body or 'no content'}"
                )
            self._custom_method_string = error_or_body
        return self
