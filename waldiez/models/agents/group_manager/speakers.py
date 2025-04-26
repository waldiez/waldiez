# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Group chat speakers."""

from typing import Dict, List, Optional, Tuple, Union

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function

WaldiezGroupManagerSpeakersSelectionMethod = Literal[
    "auto",
    "manual",
    "random",
    "round_robin",
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
    selection_custom_method : Optional[str]
        Method for custom selection.
    max_retries_for_selecting : Optional[int]
        Max retries for selecting a speaker.
    selection_mode : WaldiezGroupManagerSpeakersSelectionMode
        Selection mode.
    allow_repeat : Union[bool, List[str]]
        Allow repeat.
    allowed_or_disallowed_transitions : Dict[str, List[str]]
        Allowed or disallowed transitions.
    transitions_type : WaldiezGroupManagerSpeakersTransitionsType
        The type of transition rules to use if
        if a mapping (agent => List[agents]) is used:
        `allowed` (default) or `disallowed`
    custom_method_string : Optional[str]
        The custom method string.

    Functions
    ---------
    validate_group_speakers_config()
        Validate the speakers config.
    """

    selection_method: Annotated[
        WaldiezGroupManagerSpeakersSelectionMethod,
        Field(
            "auto",
            title="Selection Method",
            description="The next speaker selection method",
            alias="selectionMethod",
        ),
    ]
    selection_custom_method: Annotated[
        Optional[str],
        Field(
            None,
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
        Optional[int],
        Field(
            None,
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
            "repeat",
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
        Union[bool, List[str]],
        Field(
            True,
            title="Allow repeat",
            description=(
                "The speakers' repetition mode: "
                "Either a bool, or a list with agents to be allowed."
            ),
            alias="allowRepeat",
        ),
    ]
    allowed_or_disallowed_transitions: Annotated[
        Dict[str, List[str]],
        Field(
            default_factory=dict,
            title="Allowed or disallowed transitions",
            description=(
                "A mapping (agent.id => List[agent.ids])"
                "with the allowed or disallowed transitions."
            ),
            alias="allowedOrDisallowedTransitions",
        ),
    ]
    transitions_type: Annotated[
        WaldiezGroupManagerSpeakersTransitionsType,
        Field(
            "allowed",
            title="Transitions type",
            description=(
                "The type of transition rules to use if "
                "if a mapping (agent => List[agents]) is used: "
                "`allowed` (default) or `disallowed`"
            ),
            alias="transitionsType",
        ),
    ]

    _custom_method_string: Optional[str] = None

    @property
    def custom_method_string(self) -> Optional[str]:
        """Get the custom method string.

        Returns
        -------
        str
            The custom method string.
        """
        return self._custom_method_string

    def get_custom_method_function(
        self,
        name_prefix: Optional[str] = None,
        name_suffix: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Get the custom method function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        Tuple[str, str]
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
