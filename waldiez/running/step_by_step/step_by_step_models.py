# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-argument,disable=line-too-long
# flake8: noqa: E501
"""Step-by-step execution models for Waldiez."""

import re
from enum import Enum
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class WaldiezBreakpointType(Enum):
    """Types of breakpoints available."""

    EVENT = "event"  # Break on specific event type
    AGENT = "agent"  # Break on any event from specific agent
    AGENT_EVENT = "agent_event"  # Break on specific event from specific agent
    ALL = "all"  # Break on all events (default step mode)


class WaldiezDebugStepAction(Enum):
    """Available actions during step-by-step execution."""

    CONTINUE = "c"  # Continue to next event
    STEP = "s"  # Step through (same as continue, but explicit)
    RUN = "r"  # Run without stopping (disable step mode)
    QUIT = "q"  # Quit execution
    INFO = "i"  # Show detailed event information
    HELP = "h"  # Show help
    STATS = "st"  # Show execution statistics
    ADD_BREAKPOINT = "ab"  # Add a breakpoint
    REMOVE_BREAKPOINT = "rb"  # Remove a breakpoint
    LIST_BREAKPOINTS = "lb"  # List all breakpoints
    CLEAR_BREAKPOINTS = "cb"  # Clear all breakpoints
    UNKNOWN = "unknown"  # Unknown command


VALID_CONTROL_COMMANDS = {
    "",  # continue/step (allow empty input)
    "c",  # continue
    "r",  # run
    "s",  # step
    "h",  # help
    "q",  # quit
    "i",  # info
    "st",  # stats
    "ab",  # add_breakpoint
    "rb",  # remove_breakpoint
    "lb",  # list_breakpoints
    "cb",  # clear_breakpoints
}


class WaldiezBreakpoint(BaseModel):
    """Breakpoint definition with enhanced validation."""

    type: WaldiezBreakpointType
    event_type: str | None = None  # Required for EVENT and AGENT_EVENT
    agent_name: str | None = None  # Required for AGENT and AGENT_EVENT
    description: str | None = None  # Human-readable description

    @field_validator("event_type")
    @classmethod
    def validate_event_type(
        cls, v: str | None, info: ValidationInfo
    ) -> str | None:
        """Validate event type format.

        Parameters
        ----------
        v : str | None
            The event type to validate.
        info : ValidationInfo
            Validation context information.

        Returns
        -------
        str | None
            The validated event type or None if not provided.

        Raises
        ------
        ValueError
            If the event type format is invalid.
        """
        if v is None:
            return v

        # Basic validation - event types should be alphanumeric with underscores
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", v):
            raise ValueError(
                "Event type must start with a letter and contain only "
                "letters, numbers, and underscores"
            )
        return v

    @field_validator("agent_name")
    @classmethod
    def validate_agent_name(
        cls, v: str | None, info: ValidationInfo
    ) -> str | None:
        """Validate agent name format.

        Parameters
        ----------
        v : str | None
            The agent name to validate.
        info : ValidationInfo
            Validation context information.

        Returns
        -------
        str | None
            The validated agent name or None if not provided.

        Raises
        ------
        ValueError
            If the agent name format is invalid.
        """
        if v is None:
            return v

        # Agent names should not be empty or just whitespace
        if not v.strip():
            raise ValueError("Agent name cannot be empty or just whitespace")

        return v.strip()

    def model_post_init(self, __context: Any, /) -> None:
        """Validate breakpoint consistency after initialization.

        Raises
        ------
        ValueError
            If the breakpoint configuration is invalid.
        """
        if self.type == WaldiezBreakpointType.EVENT and not self.event_type:
            raise ValueError("EVENT breakpoints require an event_type")

        if self.type == WaldiezBreakpointType.AGENT and not self.agent_name:
            raise ValueError("AGENT breakpoints require an agent_name")

        if self.type == WaldiezBreakpointType.AGENT_EVENT:
            if not self.event_type or not self.agent_name:
                raise ValueError(
                    "AGENT_EVENT breakpoints require both"
                    " event_type and agent_name"
                )

    def __hash__(self) -> int:
        """Get the hash value for the breakpoint."""
        return hash((self.type, self.event_type, self.agent_name))

    def __str__(self) -> str:
        """Get the string representation for display."""
        if self.type == WaldiezBreakpointType.EVENT:
            return f"event:{self.event_type}"
        if self.type == WaldiezBreakpointType.AGENT:
            return f"agent:{self.agent_name}"
        if self.type == WaldiezBreakpointType.AGENT_EVENT:
            return f"{self.agent_name}:{self.event_type}"
        # else:  # ALL
        return "all"

    # pylint: disable=too-complex
    @classmethod
    def from_string(  # noqa: C901
        cls,
        breakpoint_str: str,
    ) -> "WaldiezBreakpoint":
        """Parse breakpoint from string format with enhanced validation.

        Parameters
        ----------
        breakpoint_str : str
            The string representation of the breakpoint.

        Returns
        -------
        WaldiezBreakpoint
            The parsed breakpoint object.

        Raises
        ------
        ValueError
            If the breakpoint string format is invalid.
        """
        if not breakpoint_str or not isinstance(  # pyright: ignore
            breakpoint_str,
            str,
        ):
            raise ValueError("Breakpoint specification cannot be empty")

        breakpoint_str = breakpoint_str.strip()
        if not breakpoint_str:
            raise ValueError(
                "Breakpoint specification cannot be just whitespace"
            )

        if breakpoint_str == "all":
            return cls(type=WaldiezBreakpointType.ALL)

        if breakpoint_str.startswith("event:"):
            event_type = breakpoint_str[6:]  # Remove "event:" prefix
            if not event_type:
                raise ValueError("Event type cannot be empty after 'event:'")
            return cls(type=WaldiezBreakpointType.EVENT, event_type=event_type)

        if breakpoint_str.startswith("agent:"):
            agent_name = breakpoint_str[6:]  # Remove "agent:" prefix
            if not agent_name:
                raise ValueError("Agent name cannot be empty after 'agent:'")
            return cls(type=WaldiezBreakpointType.AGENT, agent_name=agent_name)

        if ":" in breakpoint_str and not breakpoint_str.startswith(
            ("event:", "agent:")
        ):
            # Format: "agent_name:event_type"
            parts = breakpoint_str.split(":", 1)
            if len(parts) != 2:
                raise ValueError("Invalid agent:event format")

            agent_name, event_type = parts
            if not agent_name or not event_type:
                raise ValueError(
                    "Both agent name and event type must be specified"
                )

            return cls(
                type=WaldiezBreakpointType.AGENT_EVENT,
                agent_name=agent_name,
                event_type=event_type,
            )

        # Default to event type - but validate it's reasonable
        if ":" in breakpoint_str:
            raise ValueError(
                "Invalid breakpoint format. Use 'event:type', 'agent:name', "
                "'agent:event', or 'all'"
            )

        return cls(type=WaldiezBreakpointType.EVENT, event_type=breakpoint_str)

    def matches(self, event: dict[str, Any]) -> bool:
        """Check if this breakpoint matches the given event.

        Parameters
        ----------
        event : dict[str, Any]
            The event to check against.

        Returns
        -------
        bool
            True if the event matches the breakpoint, False otherwise.
        """
        if self.type == WaldiezBreakpointType.ALL:
            return True

        if self.type == WaldiezBreakpointType.EVENT:
            return event.get("type") == self.event_type

        if self.type == WaldiezBreakpointType.AGENT:
            return (
                event.get("sender") == self.agent_name
                or event.get("recipient") == self.agent_name
            )

        if self.type == WaldiezBreakpointType.AGENT_EVENT:
            return event.get("type") == self.event_type and (
                event.get("sender") == self.agent_name
                or event.get("recipient") == self.agent_name
            )

        return False


# Enhanced configuration class for runtime settings
class WaldiezDebugConfig(BaseModel):
    """Configuration for debug session settings."""

    max_event_history: int = Field(default=1000, ge=1, le=10000)
    auto_continue: bool = Field(default=False)
    step_mode: bool = Field(default=True)
    enable_stats_collection: bool = Field(default=True)
    command_timeout_seconds: float = Field(default=300.0, gt=0)


# Rest of the existing message classes remain the same...
class WaldiezDebugBreakpointsList(BaseModel):
    """Debug breakpoints message."""

    type: Literal["debug_breakpoints_list"] = "debug_breakpoints_list"
    breakpoints: (
        list[str | WaldiezBreakpoint] | list[str] | list[WaldiezBreakpoint]
    )

    @property
    def breakpoint_objects(self) -> list[WaldiezBreakpoint]:
        """Get all breakpoints as WaldiezBreakpoint objects."""
        result: list[WaldiezBreakpoint] = []
        for bp in self.breakpoints:
            if isinstance(bp, str):
                try:
                    result.append(WaldiezBreakpoint.from_string(bp))
                except ValueError:
                    # Skip invalid breakpoints rather than failing
                    continue
            else:
                result.append(bp)
        return result


class WaldiezDebugBreakpointAdded(BaseModel):
    """Debug breakpoint added message."""

    type: Literal["debug_breakpoint_added"] = "debug_breakpoint_added"
    breakpoint: Union[str, WaldiezBreakpoint]

    @property
    def breakpoint_object(self) -> WaldiezBreakpoint:
        """Get breakpoint as WaldiezBreakpoint object."""
        if isinstance(self.breakpoint, str):
            return WaldiezBreakpoint.from_string(self.breakpoint)
        return self.breakpoint


class WaldiezDebugBreakpointRemoved(BaseModel):
    """Debug breakpoint removed message."""

    type: Literal["debug_breakpoint_removed"] = "debug_breakpoint_removed"
    breakpoint: Union[str, WaldiezBreakpoint]

    @property
    def breakpoint_object(self) -> WaldiezBreakpoint:
        """Get breakpoint as WaldiezBreakpoint object."""
        if isinstance(self.breakpoint, str):
            return WaldiezBreakpoint.from_string(self.breakpoint)
        return self.breakpoint


class WaldiezDebugHelpCommand(BaseModel):
    """Help command information."""

    cmds: list[str] = Field(
        default_factory=list, description="List of command aliases"
    )
    desc: str


class WaldiezDebugHelpCommandGroup(BaseModel):
    """Help command group information."""

    title: str
    commands: list[WaldiezDebugHelpCommand]


class WaldiezDebugPrint(BaseModel):
    """Debug print message."""

    type: Literal["debug_print"] = "debug_print"
    content: str


class WaldiezDebugInputRequest(BaseModel):
    """Debug input request message."""

    type: Literal["debug_input_request"] = "debug_input_request"
    prompt: str
    request_id: str


class WaldiezDebugInputResponse(BaseModel):
    """Debug input response message."""

    type: Literal["debug_input_response"] = "debug_input_response"
    request_id: str
    data: str


class WaldiezDebugEventInfo(BaseModel):
    """Debug event info message."""

    type: Literal["debug_event_info"] = "debug_event_info"
    event: dict[str, Any]


class WaldiezDebugStats(BaseModel):
    """Debug stats message."""

    type: Literal["debug_stats"] = "debug_stats"
    stats: dict[str, Any]


class WaldiezDebugHelp(BaseModel):
    """Debug help message."""

    type: Literal["debug_help"] = "debug_help"
    help: list[WaldiezDebugHelpCommandGroup]


class WaldiezDebugError(BaseModel):
    """Debug error message."""

    type: Literal["debug_error"] = "debug_error"
    error: str


class WaldiezDebugBreakpointCleared(BaseModel):
    """Debug breakpoint cleared message."""

    type: Literal["debug_breakpoint_cleared"] = "debug_breakpoint_cleared"
    message: str


WaldiezDebugMessage = Annotated[
    Union[
        WaldiezDebugPrint,
        WaldiezDebugInputRequest,
        WaldiezDebugInputResponse,
        WaldiezDebugEventInfo,
        WaldiezDebugStats,
        WaldiezDebugHelp,
        WaldiezDebugError,
        WaldiezDebugBreakpointsList,
        WaldiezDebugBreakpointAdded,
        WaldiezDebugBreakpointRemoved,
        WaldiezDebugBreakpointCleared,
    ],
    Field(discriminator="type"),
]


class WaldiezDebugMessageWrapper(BaseModel):
    """Wrapper for debug messages."""

    # noinspection PyTypeHints
    message: WaldiezDebugMessage


HELP_MESSAGE = WaldiezDebugHelp(
    help=[
        WaldiezDebugHelpCommandGroup(
            title="Basic Commands",
            commands=[
                WaldiezDebugHelpCommand(
                    cmds=["continue", "c"], desc="Continue to the next step"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["step", "s"], desc="Step through the next event"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["run", "r"], desc="Run without stopping"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["quit", "q"], desc="Quit the debugger"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["info", "i"], desc="Show detailed event information"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["help", "h"], desc="Show this help message"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["stats", "st"], desc="Show execution statistics"
                ),
            ],
        ),
        WaldiezDebugHelpCommandGroup(
            title="Breakpoint Commands",
            commands=[
                WaldiezDebugHelpCommand(
                    cmds=["add_breakpoint", "ab"],
                    desc="Add breakpoint. Usage: 'ab [spec]' where spec is 'event:<type>', 'agent:<name>', '<name>:<event>', or 'all'",
                ),
                WaldiezDebugHelpCommand(
                    cmds=["remove_breakpoint", "rb"],
                    desc="Remove breakpoint. Usage: 'rb [spec]' with same format as add",
                ),
                WaldiezDebugHelpCommand(
                    cmds=["list_breakpoints", "lb"], desc="List all breakpoints"
                ),
                WaldiezDebugHelpCommand(
                    cmds=["clear_breakpoints", "cb"],
                    desc="Clear all breakpoints",
                ),
            ],
        ),
        WaldiezDebugHelpCommandGroup(
            title="Breakpoint Examples",
            commands=[
                WaldiezDebugHelpCommand(
                    desc="'ab' - Add breakpoint for the current event type"
                ),
                WaldiezDebugHelpCommand(
                    desc="'ab event:tool_call' - Break on all 'tool_call' events"
                ),
                WaldiezDebugHelpCommand(
                    desc="'ab agent:user' - Break on any event from 'user' agent"
                ),
                WaldiezDebugHelpCommand(
                    desc="'ab assistant:tool_call' - Break on 'tool_call' events from 'assistant'"
                ),
                WaldiezDebugHelpCommand(desc="'ab all' - Break on all events"),
                WaldiezDebugHelpCommand(
                    desc="'rb event:tool_call' - Remove 'tool_call' event breakpoint"
                ),
            ],
        ),
        WaldiezDebugHelpCommandGroup(
            title="Tips",
            commands=[
                WaldiezDebugHelpCommand(
                    desc="Press Enter alone to continue (same as 'c')"
                ),
                WaldiezDebugHelpCommand(
                    desc="Use (s)tep to go through events one by one"
                ),
                WaldiezDebugHelpCommand(
                    desc="Use (r)un to continue without stopping"
                ),
                WaldiezDebugHelpCommand(
                    desc="Set specific breakpoints to avoid noise: 'ab event:message'"
                ),
                WaldiezDebugHelpCommand(
                    desc="Check (st)ats regularly to monitor progress"
                ),
            ],
        ),
    ]
)
