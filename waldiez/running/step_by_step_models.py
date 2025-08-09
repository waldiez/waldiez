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
    UNKNOWN = "unknown"  # Unknown command


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
    input_id: str


class WaldiezDebugInputResponse(BaseModel):
    """Debug input response message."""

    type: Literal["debug_input_response"] = "debug_input_response"
    input_id: str
    response: str


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


WaldiezDebugMessage = Annotated[
    Union[
        WaldiezDebugPrint,
        WaldiezDebugInputRequest,
        WaldiezDebugInputResponse,
        WaldiezDebugEventInfo,
        WaldiezDebugStats,
        WaldiezDebugHelp,
        WaldiezDebugError,
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
