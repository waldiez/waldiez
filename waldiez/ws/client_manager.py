# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=too-many-try-statements,broad-exception-caught,line-too-long
# pylint: disable=too-complex,too-many-return-statements,import-error,too-many-branches
# pyright: reportUnknownMemberType=false,reportAttributeAccessIssue=false
# pyright: reportUnknownVariableType=false,reportUnknownArgumentType=false
# pyright: reportAssignmentType=false,reportUnknownParameterType=false
# pyright: reportArgumentType=false,reportUnnecessaryIsInstance=false

# flake8: noqa: C901

"""WebSocket client manager: bridges WS <-> subprocess runner."""

import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any, Callable, Literal

try:
    import websockets  # type: ignore[unused-ignore, unused-import, import-not-found, import-untyped] # noqa
except ImportError:  # pragma: no cover
    from ._mock import websockets  # type: ignore[no-redef,unused-ignore]


from waldiez.models import Waldiez
from waldiez.running.subprocess_runner.runner import WaldiezSubprocessRunner
from waldiez.storage import (
    StorageManager,
    WaldiezCheckpoint,
    WaldiezCheckpointInfo,
)

from ._file_handler import FileRequestHandler
from .errors import (
    ErrorHandler,
    MessageParsingError,
    NoInputRequestedError,
    SessionNotFoundError,
    StaleInputRequestError,
    UnsupportedActionError,
)
from .models import (
    BreakpointRequest,
    BreakpointResponse,
    ConvertWorkflowRequest,
    ExecutionMode,
    GetCheckpointsRequest,
    GetCheckpointsResponse,
    GetStatusRequest,
    PingRequest,
    PongResponse,
    RunWorkflowRequest,
    RunWorkflowResponse,
    SaveCheckpointRequest,
    SaveCheckpointResponse,
    SaveFlowRequest,
    StatusResponse,
    StepControlRequest,
    StepControlResponse,
    StepDebugNotification,
    StepRunWorkflowRequest,
    StepRunWorkflowResponse,
    SubprocessCompletionNotification,
    SubprocessOutputNotification,
    UserInputRequestNotification,
    UserInputResponse,
    WorkflowCompletionNotification,
    WorkflowStatus,
    WorkflowStatusNotification,
    create_error_response,
    parse_client_message,
)
from .session_manager import SessionManager

CWD = Path.cwd()


# pylint: disable=too-many-instance-attributes
class ClientManager:
    """Single websocket client and route messages to subprocess runners."""

    def __init__(
        self,
        websocket: websockets.ServerConnection,
        client_id: str,
        session_manager: SessionManager,
        workspace_dir: Path = CWD,
        error_handler: ErrorHandler | None = None,
    ) -> None:
        self.websocket = websocket
        self.client_id = client_id
        self.session_manager = session_manager
        self.workspace_dir = workspace_dir
        self.storage_manager = StorageManager(
            workspace_dir=workspace_dir / "workspace" / "waldiez_checkpoints"
        )
        self.is_active = True

        # Active runners per session
        self._runners: dict[str, WaldiezSubprocessRunner] = {}

        # Track pending input requests (session_id -> last request_id)
        self._pending_input: dict[str, str] = {}
        self._last_prompt: dict[str, str] = {}

        self.connection_time = time.time()

        # Extract client info
        self.remote_address = websocket.remote_address
        if not websocket.request:
            raise ValueError("WebSocket request is not available")
        self.user_agent = websocket.request.headers.get("User-Agent", "Unknown")
        # getattr(websocket, "request_headers", {}).get("User-Agent", "Unknown")
        self.logger = logging.getLogger(__name__)
        self.logger.info(
            "Client connected: %s from %s (User-Agent: %s)",
            self.client_id,
            self.remote_address,
            self.user_agent,
        )
        self.error_handler = error_handler or ErrorHandler(self.logger)

        self.loop: asyncio.AbstractEventLoop | None = None
        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            # constructed from a sync context? (tests?)
            self.loop = None

    @property
    def connection_duration(self) -> float:
        """Get connection duration in seconds."""
        return time.time() - self.connection_time

    # ---------------------------------------------------------------------
    # Outbound (server -> client)
    # ---------------------------------------------------------------------

    async def send_message(self, payload: dict[str, Any] | Any) -> bool:
        """Serialize and send a message to the client.

        Parameters
        ----------
        payload : dict[str, Any] | Any
            The message payload to send.

        Returns
        -------
        bool
            True if the message was sent successfully, False otherwise.
        """
        try:
            if hasattr(payload, "model_dump"):
                data = payload.model_dump(mode="json", exclude_none=True)
            elif isinstance(payload, dict):
                data = payload
            else:
                data = json.loads(json.dumps(payload, default=str))
            await self.websocket.send(json.dumps(data))
            return True
        except (
            websockets.ConnectionClosed,
            ConnectionResetError,
        ) as e:
            self.logger.info("Client %s disconnected: %s", self.client_id, e)
            await self.cleanup()
            return False
        except Exception as e:  # pragma: no cover
            self.logger.warning(
                "Failed sending to client %s: %s", self.client_id, e
            )
            # Record operational error
            self.error_handler.record_send_failure(self.client_id)
            return False

    def close_connection(self) -> None:
        """Mark as inactive (server will close the socket elsewhere)."""
        self.is_active = False

    async def cleanup(self) -> None:
        """Clean up resources when client disconnects."""
        for session_id, runner in self._runners.items():
            try:
                runner.stop()
                await self.session_manager.remove_session(session_id)
            except Exception as e:
                self.logger.warning(
                    "Error cleaning up session %s: %s ", session_id, e
                )

        self._runners.clear()
        self._pending_input.clear()
        self._last_prompt.clear()
        self.close_connection()

    # ---------------------------------------------------------------------
    # Runner -> Client bridges
    # ---------------------------------------------------------------------

    def _mk_on_output(
        self, session_id: str
    ) -> Callable[[dict[str, Any]], None]:
        """Runner output callback (called from runner threads)."""

        def _cb(data: dict[str, Any]) -> None:
            loop = self._ensure_loop()
            if loop is None:
                # No running loop available; best we can do is log and drop.
                self.logger.debug(
                    "No running loop to post runner output; dropping."
                )
                return
            data = {**data, "session_id": session_id}
            asyncio.run_coroutine_threadsafe(
                self._handle_runner_output(data), loop
            )

        return _cb

    # pylint: disable=no-self-use
    def _mk_on_input_request(self, session_id: str) -> Callable[[str], None]:
        """Runner input-request callback (fallback if prompt-only)."""

        def _cb(prompt: str) -> None:
            loop = self._ensure_loop()
            if loop is None:
                # No running loop available; best we can do is log and drop.
                self.logger.debug(
                    "No running loop to post runner output; dropping."
                )
                return

            request_id = f"req_{time.monotonic_ns()}"
            self._pending_input[session_id] = request_id
            self._last_prompt[session_id] = prompt or "> "

            async def notify() -> None:
                try:
                    await self.session_manager.update_session_status(
                        session_id, WorkflowStatus.INPUT_WAITING
                    )
                    await self.send_message(
                        UserInputRequestNotification(
                            session_id=session_id,
                            request_id=request_id,
                            prompt=prompt or "> ",
                            password=False,
                            timeout=120.0,
                        )
                    )
                except Exception as e:  # pragma: no cover
                    self.logger.warning("Failed to notify input request: %s", e)

            # hand off to the loop from runner thread
            asyncio.run_coroutine_threadsafe(notify(), loop)

        return _cb

    # ---------------------------------------------------------------------
    # Outbound (server -> client)
    # ---------------------------------------------------------------------

    # pylint: disable=too-many-branches
    async def handle_message(self, raw_message: str) -> dict[str, Any] | None:
        """Parse & dispatch an inbound client message.

        Return an immediate *response* dict (serialized later by server),
        or None if we've already sent notifications.

        Parameters
        ----------
        raw_message : str
            The raw message received from the client.

        Returns
        -------
        dict[str, Any] | None
            The parsed message or None if it couldn't be parsed.
        """
        try:
            msg = parse_client_message(raw_message)
        except ValueError as e:
            # Wrap in domain error and format consistently
            return self._error_to_response(MessageParsingError(str(e)))

        # Lightweight utility requests
        if isinstance(msg, PingRequest):
            return PongResponse.ok(echo_data=msg.echo_data).model_dump(
                mode="json"
            )

        if isinstance(msg, GetStatusRequest):
            server_status = await self.session_manager.get_status()
            wf_status = None
            if msg.session_id:
                session = await self.session_manager.get_session(msg.session_id)
                wf_status = session.status if session else None
            return StatusResponse.ok(
                server_status=server_status,
                workflow_status=wf_status,
                session_id=msg.session_id,
            ).model_dump(mode="json")

        if isinstance(msg, SaveFlowRequest):
            return FileRequestHandler.handle_save_request(
                msg=msg,
                workspace_dir=self.workspace_dir,
                client_id=self.client_id,
                logger=self.logger,
            )

        if isinstance(msg, ConvertWorkflowRequest):
            return FileRequestHandler.handle_convert_request(
                msg=msg,
                client_id=self.client_id,
                workspace_dir=self.workspace_dir,
                logger=self.logger,
            )

        if isinstance(msg, GetCheckpointsRequest):
            return await self._handle_get_checkpoints(msg)

        # Start workflow (STANDARD)
        if isinstance(msg, RunWorkflowRequest):
            return await self._handle_run(msg)

        # Start workflow (STEP-BY-STEP / DEBUG)
        if isinstance(msg, StepRunWorkflowRequest):
            return await self._handle_step_run(msg)

        # Step controls
        if isinstance(msg, StepControlRequest):
            return await self._handle_step_control(msg)

        # Breakpoint controls
        if isinstance(msg, BreakpointRequest):
            return await self._handle_breakpoint_control(msg)

        # User input for pending input_request
        if isinstance(msg, UserInputResponse):
            return await self._handle_user_input(msg)

        # Stop workflow
        if hasattr(msg, "type") and msg.type == "stop":
            return await self.handle_stop(msg)

        # Unknown
        return self._error_to_response(
            UnsupportedActionError(getattr(msg, "type", "unknown"))
        )

    async def _handle_get_checkpoints(
        self, msg: GetCheckpointsRequest
    ) -> dict[str, Any]:
        flow_name = ""
        if isinstance(msg.payload, str):
            flow_name = msg.payload
        elif isinstance(msg.payload, dict):
            flow_name = str(
                msg.payload.get("flow_name", msg.payload.get("flowName", ""))
            )
        if not flow_name:
            return self._error_to_response(
                error=ValueError("Invalid flow name"),
                request_id=msg.request_id,
            )
        checkpoints = self.storage_manager.history(flow_name)
        response = GetCheckpointsResponse(
            checkpoints=checkpoints, request_id=msg.request_id
        ).model_dump(mode="json")
        response["payload"] = response["checkpoints"]
        return response

    async def _handle_save_checkpoint(
        self, msg: SaveCheckpointRequest
    ) -> dict[str, Any]:
        new_checkpoint = _get_checkpoint_info(msg, self.storage_manager)
        if not new_checkpoint:
            return self._error_to_response(
                error=ValueError("Invalid request"),
                request_id=msg.request_id,
            )
        checkpoint_info, new_state = new_checkpoint
        self.storage_manager.update(
            checkpoint_info.session_name, checkpoint_info.timestamp, new_state
        )
        updated_cp = self.storage_manager.get(
            checkpoint_info.session_name, checkpoint_info.timestamp
        )
        if not updated_cp:  # pragma: no cover
            cp_dict = new_state
        else:
            cp_dict = updated_cp.to_dict()
        response = SaveCheckpointResponse(
            checkpoint=cp_dict,
            request_id=msg.request_id,
        ).model_dump(mode="json")
        response["payload"] = response["checkpoint"]
        return response

    async def _handle_run(self, msg: RunWorkflowRequest) -> dict[str, Any]:
        try:
            data_dict = json.loads(msg.data)
            waldiez = Waldiez.from_dict(data_dict)
        except Exception as e:
            return RunWorkflowResponse.fail(
                error=f"Invalid flow_data: {e}",
                session_id="",
            ).model_dump(mode="json")
        # structured path preferred
        session_id = self._next_session_id()
        runner = WaldiezSubprocessRunner(
            waldiez=waldiez,
            on_output=self._mk_on_output(session_id),
            on_input_request=self._mk_on_input_request(session_id),
            mode="run",
        )

        await self._create_session_for_runner(
            runner, ExecutionMode.STANDARD, session_id=session_id
        )
        # Fire and forget running in a thread
        asyncio.create_task(self._run_runner(session_id, runner))

        return RunWorkflowResponse.ok(
            session_id=session_id, mode=ExecutionMode.STANDARD
        ).model_dump(mode="json")

    async def _handle_step_run(
        self, msg: StepRunWorkflowRequest
    ) -> dict[str, Any]:
        try:
            data_dict = json.loads(msg.data)
            waldiez = Waldiez.from_dict(data_dict)
        except Exception as e:
            return StepRunWorkflowResponse.fail(
                error=f"Invalid flow_data: {e}",
                session_id="",
                breakpoints=msg.breakpoints,
            ).model_dump(mode="json")
        session_id = self._next_session_id()
        runner = WaldiezSubprocessRunner(
            waldiez=waldiez,
            on_output=self._mk_on_output(session_id),
            on_input_request=self._mk_on_input_request(session_id),
            mode="debug",  # step-by-step via CLI
            breakpoints=msg.breakpoints,
        )

        await self._create_session_for_runner(
            runner,
            ExecutionMode.STEP_BY_STEP,
            session_id=session_id,
        )
        session = await self.session_manager.get_session(session_id)
        if session:
            session.state.metadata.update(
                {
                    "breakpoints": list(msg.breakpoints),
                }
            )

        asyncio.create_task(self._run_runner(session_id, runner))

        return StepRunWorkflowResponse.ok(
            session_id=session_id,
            breakpoints=list(msg.breakpoints),
        ).model_dump(mode="json")

    async def _create_session_for_runner(
        self,
        runner: WaldiezSubprocessRunner,
        mode: ExecutionMode,
        session_id: str,
    ) -> None:
        await self.session_manager.create_session(
            session_id=session_id,
            client_id=self.client_id,
            mode=mode,
            runner=runner,
            temp_file=None,
            metadata={},
        )
        self._runners[session_id] = runner
        await self.session_manager.update_session_status(
            session_id, WorkflowStatus.STARTING
        )
        await self.send_message(
            WorkflowStatusNotification.make(
                session_id, WorkflowStatus.STARTING, mode
            )
        )

    async def _run_runner(
        self, session_id: str, runner: WaldiezSubprocessRunner
    ) -> None:
        """Run the subprocess in a thread.

        Completion is reported via on_output (completion message)
        and here as a fallback.

        Parameters
        ----------
        session_id : str
            The ID of the session.
        runner : WaldiezSubprocessRunner
            The runner instance to execute.
        """
        try:
            await self.session_manager.update_session_status(
                session_id, WorkflowStatus.RUNNING
            )
            # Run in thread to avoid blocking loop
            # noinspection PyTypeChecker
            await asyncio.to_thread(runner.run, mode=runner.mode)
            # If the runner emitted a completion dict,
            #  _handle_runner_output will forward it.
        except Exception as e:  # pragma: no cover
            await self.session_manager.update_session_status(
                session_id, WorkflowStatus.FAILED
            )
            await self.send_message(
                WorkflowCompletionNotification(
                    session_id=session_id,
                    success=False,
                    exit_code=-1,
                    error=str(e),
                )
            )

    async def _handle_step_control(
        self, msg: StepControlRequest
    ) -> dict[str, Any]:
        runner = self._runners.get(msg.session_id)
        if not runner:
            return StepControlResponse.fail(
                error="Session not found",
                action=msg.action,
                result="",
                session_id=msg.session_id,
            ).model_dump(mode="json")
        code: str | None
        if msg.action in {"", "c", "s", "r", "q", "i", "h", "st"}:
            code = msg.action if msg.action else "c"
        else:
            code = {
                "": "c",
                "continue": "c",
                "step": "s",
                "run": "r",
                "quit": "q",
                "info": "i",
                "help": "h",
                "stats": "st",
            }.get(msg.action)

        if not code:
            return StepControlResponse.fail(
                error=f"Unsupported action: {msg.action}",
                action=msg.action,
                result="",
                session_id=msg.session_id,
            ).model_dump(mode="json")

        runner.provide_user_input(code)
        return StepControlResponse.ok(
            action=msg.action, result="sent", session_id=msg.session_id
        ).model_dump(mode="json")

    async def _handle_breakpoint_control(
        self, msg: BreakpointRequest
    ) -> dict[str, Any]:
        runner = self._runners.get(msg.session_id)
        if not runner:
            return BreakpointResponse.fail(
                error="Session not found",
                action=msg.action,
                session_id=msg.session_id,
            ).model_dump(mode="json")

        cmd = {
            "list": "lb",
            "clear": "cb",
            "add": "ab",
            "remove": "rb",
        }[msg.action]

        # NOTE: If we later add `ab <event>`, send f"{cmd} {msg.event_type}"
        runner.provide_user_input(cmd)
        return BreakpointResponse.ok(
            action=msg.action, session_id=msg.session_id
        ).model_dump(mode="json")

    async def _handle_user_input(
        self, msg: UserInputResponse
    ) -> dict[str, Any]:
        runner = self._runners.get(msg.session_id)
        if not runner:
            return self._error_to_response(
                SessionNotFoundError(session_id=msg.session_id)
            )

        pending = self._pending_input.get(msg.session_id)
        if not pending:
            return self._error_to_response(NoInputRequestedError())
        if pending != msg.request_id:
            self.logger.debug(
                "Client %s: mismatched request_id for %s (got %s expected %s)",
                self.client_id,
                msg.session_id,
                msg.request_id,
                pending,
            )
            return self._error_to_response(
                StaleInputRequestError(
                    request_id=msg.request_id, expected_id=pending
                )
            )

        runner.provide_user_input(msg.data)
        return {"type": "ok", "success": True}

    async def handle_stop(self, msg: Any) -> dict[str, Any]:
        """Handle stop request.

        Parameters
        ----------
        msg : Any
            The stop request.

        Returns
        -------
        dict[str, Any]
            The processing result to respond with.
        """
        session_id = getattr(msg, "session_id", "")
        runner = self._runners.get(session_id)
        if not runner:
            return self._error_to_response(
                SessionNotFoundError(session_id=session_id)
            )

        try:
            await runner.a_stop()
            await self.session_manager.update_session_status(
                session_id, WorkflowStatus.STOPPING
            )
            return {
                "type": "stop_response",
                "session_id": session_id,
                "success": True,
                "forced": getattr(msg, "force", False),
            }
        except Exception as e:
            # Shape it as a standard error response
            return self._error_to_response(e)

    async def _handle_runner_output(self, data: dict[str, Any]) -> None:
        """Handle output from the runner.

        Parameters
        ----------
        data : dict[str, Any[
            The output dict from the runner.

        Interpret dicts from BaseSubprocessRunner.create_* and parse_output().
        We support:
          - type == "subprocess_output"
            -> SubprocessOutputNotification
          - type == "subprocess_completion"
            -> SubprocessCompletionNotification + status update
          - type in {"input_request", "debug_input_request"}
            -> UserInputRequestNotification
          - type startswith "debug_"
            -> StepDebugNotification
          - anything else
            -> fallback stdout SubprocessOutputNotification
        """
        # self.logger.debug("Handling runner output: %s", data)
        try:
            msg_type = str(data.get("type", "")).lower()
            session_id_raw = data.get("session_id")
            session_id = (
                str(session_id_raw)
                if session_id_raw
                else (self._guess_session_id() or "")
            )

            if msg_type in ("input_request", "debug_input_request"):
                await self._handle_runner_input_request(
                    session_id, data, is_debug=msg_type == "debug_input_request"
                )
                return

            if msg_type.startswith("debug_"):
                await self._handle_runner_debug(session_id, msg_type, data)
                return

            if msg_type == "subprocess_completion":
                await self._handle_runner_completion(session_id, data)
                return

            if msg_type == "subprocess_output":
                await self._handle_runner_subprocess_output(session_id, data)
                return

            # Fallback: dump everything as stdout line
            await self.send_message(
                SubprocessOutputNotification(
                    session_id=session_id,
                    stream="stdout",
                    content=json.dumps(data, default=str),
                    subprocess_type="output",
                    context={},
                )
            )
        except Exception as e:  # pragma: no cover
            # Convert to a debug notification so the client sees something,
            # and keep the server loop healthy.
            await self.send_message(
                StepDebugNotification(
                    session_id=self._guess_session_id() or "",
                    debug_type="error",
                    data={
                        "message": "Runner output handling failed",
                        "error": str(e),
                    },
                )
            )

    async def _handle_runner_input_request(
        self,
        session_id: str,
        data: dict[str, Any],
        is_debug: bool,
    ) -> None:
        """Handle an input request from the runner."""
        request_id = str(data.get("request_id", ""))
        prompt = str(data.get("prompt", "> "))
        if session_id and request_id:
            self._pending_input[session_id] = request_id
            self._last_prompt[session_id] = prompt
            await self.session_manager.update_session_status(
                session_id, WorkflowStatus.INPUT_WAITING
            )
            notification = UserInputRequestNotification(
                session_id=session_id,
                request_id=request_id,
                prompt=prompt,
                password=bool(data.get("password", False)),
                timeout=float(data.get("timeout", 120.0)),
            )
            msg_dump = notification.model_dump(mode="json", fallback=str)
            if is_debug:
                msg_dump["type"] = "debug_input_request"
            await self.send_message(msg_dump)

    # pylint: disable=line-too-long
    async def _handle_runner_debug(
        self, session_id: str, msg_type: str, data: dict[str, Any]
    ) -> None:
        """Handle a debug message from the runner."""
        # noinspection PyTypeChecker
        kind = msg_type.replace("debug_", "", 1) or "info"
        debug_type = (
            kind if kind in {"stats", "help", "error", "info"} else "info"
        )  # noqa: E501
        await self.send_message(
            StepDebugNotification(
                session_id=session_id,
                debug_type=debug_type,  # type: ignore
                data={
                    k: v
                    for k, v in data.items()
                    if k not in {"type", "session_id"}
                },
            )
        )

    async def _handle_runner_completion(
        self, session_id: str, data: dict[str, Any]
    ) -> None:
        """Handle a completion message from the runner."""
        success = bool(data.get("success", False))
        exit_code = int(data.get("exit_code", -1))
        message = str(data.get("message", ""))

        await self.session_manager.update_session_status(
            session_id,
            (WorkflowStatus.COMPLETED if success else WorkflowStatus.FAILED),
        )
        await self.send_message(
            SubprocessCompletionNotification(
                session_id=session_id,
                success=success,
                exit_code=exit_code,
                message=message,
                context=data.get("context", {}) or {},
            )
        )

    async def _handle_runner_subprocess_output(
        self, session_id: str, data: dict[str, Any]
    ) -> None:
        """Handle a subprocess output message from the runner."""
        stream_ = str(data.get("stream", "stdout"))
        stream: Literal["stdout", "stderr"] = (
            "stderr" if stream_ == "stderr" else "stdout"
        )
        subprocess_type_str = str(data.get("subprocess_type", "output")).lower()
        subprocess_type: Literal["output", "error", "debug"] = (
            subprocess_type_str  # type: ignore
            if subprocess_type_str in ("output", "error", "debug")
            else "output"
        )
        content = data.get("content", "")
        # noinspection PyUnreachableCode
        if not isinstance(content, str):
            # noinspection PyBroadException
            try:
                content = json.dumps(content, default=str)
            except Exception:  # pragma: no cover
                content = str(content)
        context = data.get("context", {}) or {}
        content = self._strip_prompt_if_needed(
            session_id=session_id,
            content=content,
        )
        await self.send_message(
            SubprocessOutputNotification(
                session_id=session_id,
                stream=stream,
                content=content,
                subprocess_type=subprocess_type,
                context=context,
            )
        )

    def _strip_prompt_if_needed(
        self,
        session_id: str,
        content: str,
    ) -> str:
        # let's try to avoid messages like (including the prompt):
        # \"content\": \"Prompt msg: {\\\"type\\\": \\\"text\\\",...\\}\"
        last = self._last_prompt.get(session_id)
        if last:
            s_last = last.strip()
            s_cont = content.strip()
            if s_cont.startswith(s_last):
                self._last_prompt.pop(session_id, None)
                # Remove the leading prompt text
                # Prefer removing from the original string to preserve
                # spacing after the prefix.
                idx = content.find(last)
                payload = content[idx + len(last) :].lstrip()

                # If the remainder looks like JSON,
                # try to parse and re-dispatch it
                if (
                    payload
                    and payload[0] in ("{", "[")
                    and payload[-1] in ("}", "]")
                ):
                    # noinspection TryExceptPass,PyBroadException
                    try:
                        json.loads(payload)
                    except Exception:
                        # Not valid JSON—fall through
                        # just forward the cleaned text
                        pass
                    else:
                        return payload

                # If not JSON, keep the cleaned textual payload
                return payload
        return content

    def _guess_session_id(self) -> str | None:
        """Pick any current session for this client (we typically run one)."""
        return next(iter(self._runners.keys()), None)

    def _next_session_id(self) -> str:
        return f"session_{self.client_id}_{len(self._runners) + 1:02d}"

    def _ensure_loop(self) -> asyncio.AbstractEventLoop | None:
        """Return an event loop for scheduling callbacks, if available."""
        if self.loop and not self.loop.is_closed():
            return self.loop
        try:
            # if we're now on an async path, this will work
            self.loop = asyncio.get_running_loop()
            return self.loop
        except RuntimeError:
            return None

    def _error_to_response(
        self, error: Exception, request_id: str | None = None
    ) -> dict[str, Any]:
        """Convert an exception into a standardized ErrorResponse payload.

        Parameters
        ----------
        error : Exception
            The error to convert
        request_id : str | None
            Optional request id to echo back

        Returns
        -------
        dict[str, Any]
            Serialized ErrorResponse
        """
        details = self.error_handler.handle_error(
            error, client_id=self.client_id
        )
        return create_error_response(
            error_message=details.get("message", "An error occurred"),
            error_code=int(details.get("code", 500)),
            error_type=str(details.get("error_type", "InternalError")),
            request_id=request_id,
            details=details.get("details", {}),
        ).model_dump(mode="json")


# noinspection PyBroadException,PyUnusedLocal
def _get_checkpoint_info(
    msg: SaveCheckpointRequest, storage_manager: StorageManager
) -> tuple[WaldiezCheckpointInfo, dict[str, Any]] | None:
    flow_name = ""
    payload_dict: dict[str, Any] = {}
    if isinstance(msg.payload, str):
        try:
            parsed_payload = json.loads(msg.payload)
        except BaseException:
            return None
        if not isinstance(parsed_payload, dict):
            return None
        payload_dict = parsed_payload
    else:
        payload_dict = msg.payload
    flow_name = str(
        payload_dict.get("flow_name", payload_dict.get("flowName", ""))
    )
    if not flow_name:
        return None
    checkpoint = payload_dict.get("checkpoint", {})
    if not checkpoint or not isinstance(checkpoint, dict):
        return None
    cp_ts_str = checkpoint.get("timestamp", checkpoint.get("id", "latest"))
    if cp_ts_str == "latest":
        cp_info = storage_manager.get_latest_checkpoint(flow_name)
    else:
        cp_ts = WaldiezCheckpoint.parse_timestamp(cp_ts_str)
        if not cp_ts:
            return None
        cp_info = storage_manager.get(flow_name, cp_ts)
    if not cp_info:
        return None
    state = payload_dict.get("state", {})
    if not state or not isinstance(state, dict):
        return None
    messages = state.get("messages", [])
    context_variables = state.get("context_variables", {})
    have_messages = isinstance(messages, list) and len(messages) > 0
    have_context_variables = (
        isinstance(context_variables, dict)
        and len(list(context_variables.keys())) > 0
    )
    if not have_messages and not have_context_variables:
        return None
    new_state = cp_info.checkpoint.state
    if have_messages:
        new_state["messages"] = messages
    if have_context_variables:
        new_state["context_variables"] = messages
    return cp_info, new_state
