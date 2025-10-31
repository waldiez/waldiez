# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=unused-argument
# pyright: reportImportCycles=false, reportUnusedParameter=false

"""Command handler for step-by-step execution."""

from typing import TYPE_CHECKING, Callable

from .step_by_step_models import (
    HELP_MESSAGE,
    WaldiezDebugError,
    WaldiezDebugStepAction,
)

if TYPE_CHECKING:
    # noinspection PyUnusedImports
    from .step_by_step_runner import WaldiezStepByStepRunner


# pylint: disable=too-few-public-methods
# noinspection PyUnusedLocal
class CommandHandler:
    """Handler for debug commands to reduce complexity in main runner."""

    def __init__(self, runner: "WaldiezStepByStepRunner"):
        self.runner = runner
        self._command_map: dict[
            str, Callable[[str | None], WaldiezDebugStepAction]
        ] = {
            "c": self._handle_continue,
            "s": self._handle_step,
            "r": self._handle_run,
            "q": self._handle_quit,
            "i": self._handle_info,
            "h": self._handle_help,
            "st": self._handle_stats,
            "ab": self._handle_add_breakpoint,
            "rb": self._handle_remove_breakpoint,
            "lb": self._handle_list_breakpoints,
            "cb": self._handle_clear_breakpoints,
        }

    def handle_command(self, command_line: str) -> WaldiezDebugStepAction:
        """Handle a command line input.

        Parameters
        ----------
        command_line : str
            The command line input to handle.

        Returns
        -------
        WaldiezDebugStepAction
            The action to take for the command.
        """
        if not command_line or not command_line.strip():
            return self._handle_step(None)  # Enter = step
        parts = command_line.strip().split(maxsplit=1)
        if not parts or not parts[0]:
            return self._handle_unknown(None)
        command = parts[0].lower()
        args = parts[1] if len(parts) > 1 else None

        handler = self._command_map.get(command, self._handle_unknown)
        return handler(args)

    def _handle_continue(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.step_mode = True
        return WaldiezDebugStepAction.CONTINUE

    def _handle_step(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.step_mode = True
        return WaldiezDebugStepAction.STEP

    def _handle_run(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.step_mode = False
        return WaldiezDebugStepAction.RUN

    def _handle_quit(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.set_stop_requested()
        return WaldiezDebugStepAction.QUIT

    def _handle_info(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.show_event_info()
        return WaldiezDebugStepAction.INFO

    def _handle_help(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.emit(HELP_MESSAGE)
        return WaldiezDebugStepAction.HELP

    def _handle_stats(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.show_stats()
        return WaldiezDebugStepAction.STATS

    def _handle_add_breakpoint(
        self, args: str | None
    ) -> WaldiezDebugStepAction:
        if args:
            self.runner.add_breakpoint(args)
            return WaldiezDebugStepAction.ADD_BREAKPOINT
        current_event = self.runner.current_event
        if current_event and hasattr(current_event, "type"):
            self.runner.add_breakpoint(getattr(current_event, "type", ""))
            return WaldiezDebugStepAction.ADD_BREAKPOINT
        # else:
        self.runner.emit(
            WaldiezDebugError(
                error=(
                    "No breakpoint specification provided "
                    "and no current event available"
                )
            )
        )
        return WaldiezDebugStepAction.ADD_BREAKPOINT

    def _handle_remove_breakpoint(
        self, args: str | None
    ) -> WaldiezDebugStepAction:
        if args:
            self.runner.remove_breakpoint(args)
            return WaldiezDebugStepAction.REMOVE_BREAKPOINT
        current_event = self.runner.current_event
        if current_event and hasattr(current_event, "type"):
            self.runner.remove_breakpoint(getattr(current_event, "type", ""))
            return WaldiezDebugStepAction.REMOVE_BREAKPOINT
        # else:
        self.runner.emit(
            WaldiezDebugError(
                error=(
                    "No breakpoint specification provided and "
                    "no current event available"
                )
            )
        )
        return WaldiezDebugStepAction.REMOVE_BREAKPOINT

    def _handle_list_breakpoints(
        self, args: str | None
    ) -> WaldiezDebugStepAction:
        self.runner.list_breakpoints()
        return WaldiezDebugStepAction.LIST_BREAKPOINTS

    def _handle_clear_breakpoints(
        self, args: str | None
    ) -> WaldiezDebugStepAction:
        self.runner.clear_breakpoints()
        return WaldiezDebugStepAction.CLEAR_BREAKPOINTS

    def _handle_unknown(self, args: str | None) -> WaldiezDebugStepAction:
        self.runner.emit(
            WaldiezDebugError(error="Unknown command. Use 'h' for help")
        )
        return WaldiezDebugStepAction.UNKNOWN
