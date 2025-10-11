# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pyright: reportUnknownMemberType=false, reportAttributeAccessIssue=false
# pyright: reportMissingTypeStubs=false, reportDeprecated=false
# pylint: disable=duplicate-code,too-few-public-methods
"""Run a waldiez flow.

The flow is first converted to an autogen flow with agents, chats, and tools.
We then chown to temporary directory, call the flow's `main()` and
return the results. Before running the flow, any additional environment
variables specified in the waldiez file are set.
"""

import asyncio
import traceback
from pathlib import Path
from typing import TYPE_CHECKING, Any, Union

from typing_extensions import override

from waldiez.models.waldiez import Waldiez

from .base_runner import WaldiezBaseRunner
from .events_mixin import EventsMixin
from .results_mixin import WaldiezRunResults

if TYPE_CHECKING:
    from autogen.agentchat import ConversableAgent  # type: ignore
    from autogen.events import BaseEvent  # type: ignore
    from autogen.messages import BaseMessage  # type: ignore


MESSAGES = {
    "workflow_starting": "<Waldiez> - Starting workflow...",
    "workflow_finished": "<Waldiez> - Workflow finished",
    "workflow_stopped": "<Waldiez> - Workflow stopped by user",
    "workflow_failed": "<Waldiez> - Workflow execution failed: {error}",
}


# noinspection StrFormat
class WaldiezStandardRunner(WaldiezBaseRunner):
    """Run a waldiez flow in a standard way."""

    def __init__(
        self,
        waldiez: Waldiez,
        output_path: str | Path | None = None,
        uploads_root: str | Path | None = None,
        structured_io: bool = False,
        dot_env: str | Path | None = None,
        **kwargs: Any,
    ) -> None:
        """Initialize the Waldiez manager."""
        super().__init__(
            waldiez,
            output_path=output_path,
            uploads_root=uploads_root,
            structured_io=structured_io,
            dot_env=dot_env,
            **kwargs,
        )
        self._event_count = 0
        self._processed_events = 0

    # pylint: disable=unused-argument
    @override
    def _run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool,
        skip_timeline: bool,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow."""
        # pylint: disable=import-outside-toplevel
        from autogen.io import IOStream  # type: ignore

        from waldiez.io import StructuredIOStream

        results_container: WaldiezRunResults = {
            "results": [],
            "exception": None,
            "completed": False,
        }
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            loaded_module = self._load_module(output_file, temp_dir)
            if self._stop_requested.is_set():
                self.log.debug(
                    "Execution stopped before AG2 workflow start (sync)"
                )
                return []
            # noinspection DuplicatedCode
            if self.structured_io:
                stream = StructuredIOStream(
                    uploads_root=uploads_root, is_async=False
                )
            else:
                stream = IOStream.get_default()
            EventsMixin.set_print_function(stream.print)
            EventsMixin.set_input_function(stream.input)
            EventsMixin.set_send_function(stream.send)
            self.print(MESSAGES["workflow_starting"])
            self.print(self.waldiez.info.model_dump_json())
            results = loaded_module.main(
                on_event=self._on_event,
            )
            results_container["results"] = results
            self.print(MESSAGES["workflow_finished"])
        except SystemExit:  # pragma: no cover
            self.log.debug("Execution stopped by user (sync)")
            self.print(MESSAGES["workflow_stopped"])
        except BaseException as e:  # pragma: no cover
            results_container["exception"] = e
            traceback.print_exc()
            self.print(MESSAGES["workflow_failed"].format(error=e))

        finally:
            results_container["completed"] = True
        return results_container["results"]

    def _on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
    ) -> bool:
        """Process an event from the workflow."""
        self._event_count += 1
        if self._stop_requested.is_set():
            self.log.debug(
                "Execution stopped before AG2 workflow event processing (sync)"
            )
            return False
        try:
            EventsMixin.process_event(event, agents)
            self._processed_events += 1
        except SystemExit:  # pragma: no cover
            self.log.debug("Execution stopped by user (sync)")
            return False
        except Exception as e:
            if self._stop_requested.is_set():
                self.log.debug("Exception during stop, returning False")
                return False
            raise RuntimeError(
                f"Error processing event {event}: {e}\n{traceback.format_exc()}"
            ) from e
        return not self._stop_requested.is_set()

    async def _a_on_event(
        self,
        event: Union["BaseEvent", "BaseMessage"],
        agents: list["ConversableAgent"],
    ) -> bool:
        """Process an event from the workflow asynchronously."""
        self._event_count += 1
        if self._stop_requested.is_set():  # pragma: no cover
            self.log.debug(
                "Execution stopped before AG2 workflow event processing (async)"
            )
            return False
        try:
            await EventsMixin.a_process_event(event, agents)
            self._processed_events += 1
        except SystemExit:  # pragma: no cover
            self.log.debug("Execution stopped by user (async)")
            return False
        except Exception as e:
            if self._stop_requested.is_set():
                self.log.debug("Exception during stop, returning False")
                return False
            raise RuntimeError(
                f"Error processing event {event}: {e}\n{traceback.format_exc()}"
            ) from e
        return not self._stop_requested.is_set()

    # pylint: disable=too-complex
    @override
    async def _a_run(
        self,
        temp_dir: Path,
        output_file: Path,
        uploads_root: Path | None,
        skip_mmd: bool = False,
        skip_timeline: bool = False,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Run the Waldiez workflow asynchronously."""

        # fmt: off
        async def _execute_workflow() -> list[dict[str, Any]]:
            # fmt: on
            """Execute the workflow in an async context."""
            # pylint: disable=import-outside-toplevel
            from autogen.io import IOStream

            from waldiez.io import StructuredIOStream

            results: list[dict[str, Any]]
            # pylint: disable=too-many-try-statements,broad-exception-caught
            try:
                loaded_module = self._load_module(output_file, temp_dir)
                if self._stop_requested.is_set():  # pragma: no cover
                    msg = (
                        "Execution stopped before AG2 "
                        "workflow event processing (async)"
                    )
                    self.log.debug(msg)
                    return []
                # noinspection DuplicatedCode
                if self.structured_io:
                    stream = StructuredIOStream(
                        uploads_root=uploads_root, is_async=True
                    )
                else:
                    stream = IOStream.get_default()
                EventsMixin.set_print_function(stream.print)
                EventsMixin.set_input_function(stream.input)
                EventsMixin.set_send_function(stream.send)
                self.print(MESSAGES["workflow_starting"])
                self.print(self.waldiez.info.model_dump_json())
                results = await loaded_module.main(
                    on_event=self._a_on_event
                )
                self.print(MESSAGES["workflow_finished"])
            except SystemExit:  # pragma: no cover
                self.log.debug("Execution stopped by user (async)")
                self.print(MESSAGES["workflow_stopped"])
                return []
            except Exception as e:  # pragma: no cover
                self.print(MESSAGES["workflow_failed"].format(error=str(e)))
                raise RuntimeError(
                    f"Error loading workflow: {e}\n{traceback.format_exc()}"
                ) from e
            return results

        # Create cancellable task
        task = asyncio.create_task(_execute_workflow())

        # Monitor for stop requests
        # pylint: disable=too-many-try-statements
        try:
            while not task.done():
                if self._stop_requested.is_set():
                    task.cancel()
                    self.log.debug("Execution stopped by user (async)")
                    break
                await asyncio.sleep(0.1)
            # Return the task result when completed
            return await task

        except asyncio.CancelledError:
            self.log.debug("Execution cancelled (async)")
            return []
