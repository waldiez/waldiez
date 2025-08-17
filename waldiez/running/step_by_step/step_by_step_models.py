# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Step-by-step execution models for Waldiez."""

from enum import Enum
from typing import Annotated, Any, Dict, Literal, Union

from pydantic import BaseModel, Field


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
    event: Dict[str, Any]


class WaldiezDebugStats(BaseModel):
    """Debug stats message."""

    type: Literal["debug_stats"] = "debug_stats"
    stats: Dict[str, Any]


class WaldiezDebugHelp(BaseModel):
    """Debug help message."""

    type: Literal["debug_help"] = "debug_help"
    help: list[WaldiezDebugHelpCommandGroup]


class WaldiezDebugError(BaseModel):
    """Debug error message."""

    type: Literal["debug_error"] = "debug_error"
    error: str


class WaldiezDebugBreakpointsList(BaseModel):
    """Debug breakpoints message."""

    type: Literal["debug_breakpoints_list"] = "debug_breakpoints_list"
    breakpoints: list[str]  # Event types
    # Optional: Could extend to include agent+event combinations


class WaldiezDebugBreakpointAdded(BaseModel):
    """Debug breakpoint added message."""

    type: Literal["debug_breakpoint_added"] = "debug_breakpoint_added"
    breakpoint: str


class WaldiezDebugBreakpointRemoved(BaseModel):
    """Debug breakpoint removed message."""

    type: Literal["debug_breakpoint_removed"] = "debug_breakpoint_removed"
    breakpoint: str


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

    message: WaldiezDebugMessage


HELP_MESSAGE = WaldiezDebugHelp(
    help=[
        WaldiezDebugHelpCommandGroup(
            title="Commands",
            commands=[
                WaldiezDebugHelpCommand(
                    cmds=["continue", "c"], desc="Continue to the next step."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["step", "s"], desc="Step through the next event."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["run", "r"], desc="Run without stopping."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["quit", "q"], desc="Quit the debugger."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["info", "i"], desc="Show detailed event information."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["help", "h"], desc="Show this help message."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["stats", "st"], desc="Show execution statistics."
                ),
                WaldiezDebugHelpCommand(
                    cmds=["add_breakpoint", "ab"],
                    desc="Add breakpoint for event type.",
                ),
                WaldiezDebugHelpCommand(
                    cmds=["remove_breakpoint", "rb"],
                    desc="Remove breakpoint for event type.",
                ),
                WaldiezDebugHelpCommand(
                    cmds=["list_breakpoints", "lb"],
                    desc="List all breakpoints.",
                ),
                WaldiezDebugHelpCommand(
                    cmds=["clear_breakpoints", "cb"],
                    desc="Clear all breakpoints.",
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
                    desc="Use (s)tep to go through events one by one."
                ),
                WaldiezDebugHelpCommand(
                    desc="Use (r)un to continue without stopping."
                ),
            ],
        ),
    ]
)
