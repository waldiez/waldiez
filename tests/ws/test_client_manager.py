# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc,missing-raises-doc
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# pylint: disable=no-self-use,unused-argument,too-many-try-statements
# pylint: disable=broad-exception-caught,protected-access,line-too-long
# pylint: disable=attribute-defined-outside-init,too-many-public-methods
# pyright: reportPrivateUsage=false,reportUnknownMemberType=false
# pyright: reportAttributeAccessIssue=false
# flake8: noqa: E501
"""Tests for ClientManager functionality."""

import json
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Callable
from unittest.mock import MagicMock, patch

import pytest

from waldiez.models.waldiez import Waldiez
from waldiez.ws.client_manager import ClientManager
from waldiez.ws.models import (
    ExecutionMode,
    PingRequest,
    WorkflowStatus,
)
from waldiez.ws.session_manager import SessionManager


class MockWebSocket:
    """Mock WebSocket connection for testing."""

    def __init__(
        self,
        remote_address: tuple[str, int] = ("127.0.0.1", 12345),
        user_agent: str = "Test Client",
    ):
        self.remote_address = remote_address
        self.request = SimpleNamespace(headers={"User-Agent": user_agent})
        self.sent_messages: list[str] = []
        self._closed = False

    async def send(self, message: str) -> None:
        """Mock send method."""
        if not self._closed:
            self.sent_messages.append(message)

    async def close(self) -> None:
        """Mock close method."""
        self._closed = True

    def get_last_message(self) -> dict[str, Any] | None:
        """Get the last sent message as dict."""
        if self.sent_messages:
            return json.loads(self.sent_messages[-1])
        return None

    def get_all_messages(self) -> list[dict[str, Any]]:
        """Get all sent messages as dicts."""
        return [json.loads(msg) for msg in self.sent_messages]


class MockSubprocessRunner:
    """Mock subprocess runner for testing."""

    def __init__(self, mode: str = "run"):
        self.mode = mode
        self.waldiez = None
        self.on_output: Callable[[Any], None] | None = None
        self.on_input_request: Callable[[Any], None] | None = None
        self.is_stopped = False
        self.input_queue: list[str] = []

    # noinspection PyUnusedLocal
    def run(self, mode: str | None = None) -> None:
        """Mock run method."""
        if self.is_stopped:
            return
        # Simulate some output
        if self.on_output:
            # pylint: disable=not-callable
            self.on_output(
                {
                    "type": "subprocess_output",
                    "session_id": "test_session",
                    "stream": "stdout",
                    "content": "Test output",
                }
            )

    def stop(self) -> None:
        """Mock stop method."""
        self.is_stopped = True

    async def a_stop(self) -> None:
        """Mock stop method."""
        self.is_stopped = True

    def provide_user_input(self, input_data: str) -> None:
        """Mock user input method."""
        self.input_queue.append(input_data)


# pylint: disable=too-many-public-methods
class TestClientManager:
    """Test ClientManager functionality."""

    def setup_method(self) -> None:
        """Set up test method."""
        self.mock_websocket = MockWebSocket()
        self.client_id = "test_client_123"
        self.session_manager = SessionManager()

        # Create client manager
        self.client_manager = ClientManager(
            websocket=self.mock_websocket,  # type: ignore[arg-type,unused-ignore] # noqa
            client_id=self.client_id,
            session_manager=self.session_manager,
        )

    def test_client_manager_init(self) -> None:
        """Test ClientManager initialization."""
        assert self.client_manager.websocket is self.mock_websocket
        assert self.client_manager.client_id == self.client_id
        assert self.client_manager.session_manager is self.session_manager
        assert self.client_manager.is_active is True
        assert self.client_manager.remote_address == ("127.0.0.1", 12345)
        assert self.client_manager.user_agent == "Test Client"
        assert self.client_manager.connection_duration >= 0

    def test_client_manager_init_no_request(self) -> None:
        """Test ClientManager initialization without request."""
        mock_websocket = MockWebSocket()
        mock_websocket.request = None  # type: ignore

        with pytest.raises(
            ValueError, match="WebSocket request is not available"
        ):
            ClientManager(
                websocket=mock_websocket,  # type: ignore[arg-type,unused-ignore] # noqa
                client_id=self.client_id,
                session_manager=self.session_manager,
            )

    @pytest.mark.asyncio
    async def test_send_message_dict(self) -> None:
        """Test sending dictionary message."""
        message = {"type": "test", "data": "hello"}

        result = await self.client_manager.send_message(message)

        assert result is True
        assert len(self.mock_websocket.sent_messages) == 1
        sent_data = json.loads(self.mock_websocket.sent_messages[0])
        assert sent_data == message

    @pytest.mark.asyncio
    async def test_send_message_pydantic_model(self) -> None:
        """Test sending Pydantic model message."""
        request = PingRequest(echo_data={"test": "data"})

        result = await self.client_manager.send_message(request)

        assert result is True
        assert len(self.mock_websocket.sent_messages) == 1
        sent_data = json.loads(self.mock_websocket.sent_messages[0])
        assert sent_data["type"] == "ping"
        assert sent_data["echo_data"] == {"test": "data"}

    @pytest.mark.asyncio
    async def test_send_message_other_object(self) -> None:
        """Test sending other object types."""
        message = ["test", "list"]

        result = await self.client_manager.send_message(message)

        assert result is True
        sent_data = json.loads(self.mock_websocket.sent_messages[0])
        assert sent_data == ["test", "list"]

    @pytest.mark.asyncio
    async def test_send_message_failure(self) -> None:
        """Test send message failure handling."""
        # Close the websocket to simulate failure
        self.mock_websocket._closed = True

        with patch.object(
            self.mock_websocket, "send", side_effect=Exception("Send failed")
        ):
            result = await self.client_manager.send_message({"test": "data"})

        assert result is False

    @pytest.mark.asyncio
    async def test_close_connection(self) -> None:
        """Test closing connection."""
        assert self.client_manager.is_active is True

        self.client_manager.close_connection()

        assert self.client_manager.is_active is False

    @pytest.mark.asyncio
    async def test_handle_ping_request(self) -> None:
        """Test handling ping request."""
        echo_data = {"test": "ping"}
        message = json.dumps({"type": "ping", "echo_data": echo_data})

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "pong"
        assert response["echo_data"] == echo_data
        assert response["success"] is True

    @pytest.mark.asyncio
    async def test_handle_get_status_request(self) -> None:
        """Test handling get status request."""
        await self.session_manager.start()

        try:
            message = json.dumps({"type": "get_status"})

            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "status_response"
            assert response["success"] is True
            assert "server_status" in response

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_get_status_request_with_session(self) -> None:
        """Test handling get status request with session ID."""
        await self.session_manager.start()

        try:
            # Create a test session
            await self.session_manager.create_session(
                session_id="test_session",
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
            )

            message = json.dumps(
                {"type": "get_status", "session_id": "test_session"}
            )

            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "status_response"
            assert response["session_id"] == "test_session"
            assert response["workflow_status"] == WorkflowStatus.IDLE.value

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_save_request(self) -> None:
        """Test handling save flow request."""
        test_file = Path("test_handle_save_request.waldiez")
        if test_file.exists():
            test_file.unlink()
        flow_data = '{"nodes": [], "edges": []}'

        message = json.dumps(
            {
                "type": "save",
                "data": flow_data,
                "path": str(test_file),
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "save_response"
        if response["success"] is False:
            raise ValueError(response["error"])
        assert response["path"] == str(test_file)

        # Verify file was created
        assert test_file.exists()
        assert test_file.read_text(encoding="utf-8") == flow_data
        try:
            test_file.unlink()
        except (FileNotFoundError, OSError, PermissionError):
            pass

    @pytest.mark.asyncio
    async def test_handle_save_request_file_exists(self) -> None:
        """Test handling save flow request when file exists."""
        test_file = Path("test_handle_save_request_file_exists.waldiez")
        test_file.write_text("existing content", encoding="utf-8")

        message = json.dumps(
            {
                "type": "save",
                "data": '{"new": "data"}',
                "path": str(test_file),
                "force": False,
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "save_response"
        assert response["success"] is False
        assert "File exists" in response["error"]
        try:
            test_file.unlink()
        except (FileNotFoundError, OSError, PermissionError):
            pass

    @pytest.mark.asyncio
    async def test_handle_save_request_force_overwrite(self) -> None:
        """Test handling save flow request with force overwrite."""
        test_file = Path("test_handle_save_request_force_overwrite.waldiez")
        test_file.write_text("old content", encoding="utf-8")
        new_content = '{"new": "data"}'

        message = json.dumps(
            {
                "type": "save",
                "data": new_content,
                "path": str(test_file),
                "force": True,
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "save_response"
        assert response["success"] is True
        assert test_file.read_text(encoding="utf-8") == new_content
        try:
            test_file.unlink()
        except (FileNotFoundError, OSError, PermissionError):
            pass

    @pytest.mark.asyncio
    async def test_handle_save_request_default_filename(self) -> None:
        """Test handling save flow request with default filename."""
        flow_data = '{"test": "data"}'

        message = json.dumps({"type": "save", "data": flow_data})

        with patch("pathlib.Path.write_text") as mock_write:
            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "save_response"
            assert response["success"] is True
            assert f"waldiez_{self.client_id}.waldiez" in response["path"]
            mock_write.assert_called_once_with(
                flow_data, encoding="utf-8", newline="\n"
            )

    @pytest.mark.asyncio
    async def test_handle_convert_request(self) -> None:
        """Test handling convert workflow request."""
        # Mock valid waldiez data
        flow_data = json.dumps(
            {
                "id": "test_flow",
                "name": "Test Flow",
                "description": "Test description",
                "tags": [],
                "requirements": [],
                "agents": {},
                "models": {},
                "skills": {},
                "flows": {},
            }
        )

        message = json.dumps(
            {
                "type": "convert",
                "data": flow_data,
                "format": "py",
                "path": "test_output.py",
            }
        )

        with patch("waldiez.ws._file_handler.Waldiez") as mock_waldiez_class:
            mock_waldiez = MagicMock()
            mock_waldiez_class.from_dict.return_value = mock_waldiez

            with patch(
                "waldiez.ws._file_handler.WaldiezExporter"
            ) as mock_exporter_class:
                mock_exporter = MagicMock()
                mock_exporter_class.return_value = mock_exporter

                with patch(
                    "pathlib.Path.read_text",
                    return_value="# Generated Python code",
                ):
                    response = await self.client_manager.handle_message(message)

                    assert response is not None
                    assert response["type"] == "convert_response"
                    assert response["success"] is True
                    assert response["format"] == "py"

    @pytest.mark.asyncio
    async def test_handle_convert_request_invalid_flow(self) -> None:
        """Test handling convert workflow request with invalid flow data."""
        message = json.dumps(
            {
                "type": "convert",
                "data": "invalid json",
                "format": "py",
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "convert_response"
        assert response["success"] is False
        assert "Invalid flow_data" in response["error"]

    @pytest.mark.asyncio
    async def test_handle_run_request(self) -> None:
        """Test handling run workflow request."""
        await self.session_manager.start()

        try:
            flow_data = Waldiez.default().model_dump_json()
            message = json.dumps(
                {
                    "type": "run",
                    "data": flow_data,
                }
            )

            with patch(
                "waldiez.ws.client_manager.Waldiez"
            ) as mock_waldiez_class:
                mock_waldiez = MagicMock()
                mock_waldiez_class.from_dict.return_value = mock_waldiez

                with patch(
                    "waldiez.ws.client_manager.WaldiezSubprocessRunner"
                ) as mock_runner_class:
                    mock_runner = MockSubprocessRunner()
                    mock_runner_class.return_value = mock_runner
                    response = await self.client_manager.handle_message(message)

                    assert response is not None
                    assert response["type"] == "run_response"
                    assert response["success"] is True
                    assert "session_id" in response

                    # Verify runner was created and task was scheduled
                    mock_runner_class.assert_called_once()

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_run_request_invalid_flow(self) -> None:
        """Test handling run workflow request with invalid flow data."""
        message = json.dumps(
            {
                "type": "run",
                "data": "invalid json",
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "run_response"
        assert response["success"] is False
        assert "Invalid flow_data" in response["error"]

    @pytest.mark.asyncio
    async def test_handle_step_run_request(self) -> None:
        """Test handling step run workflow request."""
        await self.session_manager.start()

        try:
            # Mock valid waldiez data
            flow_data = Waldiez.default().model_dump_json()

            message = json.dumps(
                {
                    "type": "step_run",
                    "data": flow_data,
                    "breakpoints": ["event1", "event2"],
                }
            )

            with patch(
                "waldiez.ws.client_manager.Waldiez"
            ) as mock_waldiez_class:
                mock_waldiez = MagicMock()
                mock_waldiez_class.from_dict.return_value = mock_waldiez

                with patch(
                    "waldiez.ws.client_manager.WaldiezSubprocessRunner"
                ) as mock_runner_class:
                    mock_runner = MockSubprocessRunner(mode="debug")
                    mock_runner_class.return_value = mock_runner

                    response = await self.client_manager.handle_message(message)

                    assert response is not None
                    assert response["type"] == "step_run_response"
                    assert response["success"] is True
                    assert response["breakpoints"] == ["event1", "event2"]

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_step_control_request(self) -> None:
        """Test handling step control request."""
        await self.session_manager.start()

        try:
            # Create a session with mock runner
            mock_runner = MockSubprocessRunner()
            session_id = "test_session"
            self.client_manager._runners[session_id] = mock_runner  # type: ignore

            message = json.dumps(
                {
                    "type": "step_control",
                    "action": "continue",
                    "session_id": session_id,
                }
            )

            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "step_control_response"
            assert response["success"] is True
            assert response["action"] == "continue"
            assert response["result"] == "sent"
            assert response["session_id"] == session_id

            # Verify the command was sent to runner
            assert "c" in mock_runner.input_queue

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_step_control_request_session_not_found(self) -> None:
        """Test handling step control request for non-existent session."""
        message = json.dumps(
            {
                "type": "step_control",
                "action": "continue",
                "session_id": "nonexistent",
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["type"] == "step_control_response"
        assert response["success"] is False
        assert "Session not found" in response["error"]

    @pytest.mark.asyncio
    async def test_handle_step_control_request_invalid_action(self) -> None:
        """Test handling step control request with invalid action."""
        await self.session_manager.start()

        try:
            # Create a session with mock runner
            mock_runner = MockSubprocessRunner()
            session_id = "test_session"
            self.client_manager._runners[session_id] = mock_runner  # type: ignore

            message = json.dumps(
                {
                    "type": "step_control",
                    "action": "invalid_action",
                    "session_id": session_id,
                }
            )

            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "error"
            assert response["success"] is False
            assert "Invalid client message" in response["error"]

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_breakpoint_request(self) -> None:
        """Test handling breakpoint request."""
        await self.session_manager.start()

        try:
            # Create a session with mock runner
            mock_runner = MockSubprocessRunner()
            session_id = "test_session"
            self.client_manager._runners[session_id] = mock_runner  # type: ignore

            message = json.dumps(
                {
                    "type": "breakpoint_control",
                    "action": "add",
                    "session_id": session_id,
                }
            )

            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "breakpoint_response"
            assert response["success"] is True
            assert response["action"] == "add"
            assert response["session_id"] == session_id

            # Verify the command was sent to runner
            assert "ab" in mock_runner.input_queue

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_user_input_response(self) -> None:
        """Test handling user input response."""
        await self.session_manager.start()

        try:
            # Create a session with mock runner
            mock_runner = MockSubprocessRunner()
            session_id = "test_session"
            request_id = "req_123"
            self.client_manager._runners[session_id] = mock_runner  # type: ignore
            self.client_manager._pending_input[session_id] = request_id

            message = json.dumps(
                {
                    "type": "user_input",
                    "request_id": request_id,
                    "data": "user response",
                    "session_id": session_id,
                }
            )

            response = await self.client_manager.handle_message(message)

            assert response is not None
            assert response["type"] == "ok"
            assert response["success"] is True

            # Verify user input was sent to runner
            assert "user response" in mock_runner.input_queue

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_user_input_response_session_not_found(self) -> None:
        """Test handling user input response for non-existent session."""
        message = json.dumps(
            {
                "type": "user_input",
                "request_id": "req_123",
                "data": "user response",
                "session_id": "nonexistent",
            }
        )

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["error_type"] == "SessionNotFound"
        assert response["success"] is False

    @pytest.mark.asyncio
    async def test_handle_stop_request(self) -> None:
        """Test handling stop workflow request."""
        await self.session_manager.start()

        try:
            # Create a session with mock runner
            mock_runner = MockSubprocessRunner()
            session_id = "test_session"
            self.client_manager._runners[session_id] = mock_runner  # type: ignore

            message = SimpleNamespace(
                type="stop", session_id=session_id, force=False
            )

            response = await self.client_manager.handle_stop(message)

            assert response is not None
            assert response["type"] == "stop_response"
            assert response["success"] is True
            assert response["session_id"] == session_id
            assert response["forced"] is False

            # Verify runner was stopped
            assert mock_runner.is_stopped is True

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_invalid_message_type(self) -> None:
        """Test handling invalid message type."""
        message = json.dumps({"type": "invalid_type", "data": "test"})

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["error_type"] in (
            "MessageParsingError",
            "InvalidMessageFormat",
        )
        assert response["success"] is False

    @pytest.mark.asyncio
    async def test_handle_malformed_message(self) -> None:
        """Test handling malformed message."""
        message = "invalid json content"

        response = await self.client_manager.handle_message(message)

        assert response is not None
        assert response["error_type"] in (
            "MessageParsingError",
            "InvalidMessageFormat",
        )
        assert response["success"] is False

    @pytest.mark.asyncio
    async def test_handle_runner_output_subprocess_output(self) -> None:
        """Test handling subprocess output from runner."""
        data = {
            "type": "subprocess_output",
            "session_id": "test_session",
            "stream": "stdout",
            "content": "Test output content",
            "subprocess_type": "output",
        }

        await self.client_manager._handle_runner_output(data)

        # Verify message was sent
        sent_message = self.mock_websocket.get_last_message()
        assert sent_message is not None
        assert sent_message["type"] == "subprocess_output"
        assert sent_message["session_id"] == "test_session"
        assert sent_message["content"] == "Test output content"

    @pytest.mark.asyncio
    async def test_handle_runner_output_completion(self) -> None:
        """Test handling subprocess completion from runner."""
        await self.session_manager.start()

        try:
            data: dict[str, Any] = {
                "type": "subprocess_completion",
                "session_id": "test_session",
                "success": True,
                "exit_code": 0,
                "message": "Completed successfully",
            }

            await self.client_manager._handle_runner_output(data)

            # Verify message was sent
            sent_message = self.mock_websocket.get_last_message()
            assert sent_message is not None
            assert sent_message["type"] == "subprocess_completion"
            assert sent_message["success"] is True
            assert sent_message["exit_code"] == 0

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_runner_output_input_request(self) -> None:
        """Test handling input request from runner."""
        await self.session_manager.start()

        try:
            data: dict[str, Any] = {
                "type": "input_request",
                "session_id": "test_session",
                "request_id": "req_123",
                "prompt": "Enter value: ",
                "password": False,
                "timeout": 120.0,
            }

            await self.client_manager._handle_runner_output(data)

            # Verify input request was stored
            assert (
                self.client_manager._pending_input.get("test_session")
                == "req_123"
            )

            # Verify message was sent
            sent_message = self.mock_websocket.get_last_message()
            assert sent_message is not None
            assert sent_message["type"] == "input_request"
            assert sent_message["request_id"] == "req_123"

        finally:
            await self.session_manager.stop()

    @pytest.mark.asyncio
    async def test_handle_runner_output_debug_info(self) -> None:
        """Test handling debug info from runner."""
        data: dict[str, Any] = {
            "type": "debug_stats",
            "session_id": "test_session",
            "stats": {"current_step": 1, "total_steps": 5},
        }

        await self.client_manager._handle_runner_output(data)

        # Verify message was sent
        sent_message = self.mock_websocket.get_last_message()
        assert sent_message is not None
        assert sent_message["type"] == "step_debug"
        assert sent_message["debug_type"] == "stats"
        assert sent_message["session_id"] == "test_session"

    @pytest.mark.asyncio
    async def test_handle_runner_output_fallback(self) -> None:
        """Test handling unknown runner output (fallback)."""
        data = {
            "type": "unknown_type",
            "session_id": "test_session",
            "some_data": "test value",
        }

        await self.client_manager._handle_runner_output(data)

        # Verify fallback message was sent
        sent_message = self.mock_websocket.get_last_message()
        assert sent_message is not None
        assert sent_message["type"] == "subprocess_output"
        assert sent_message["stream"] == "stdout"
        assert "unknown_type" in sent_message["content"]

    @pytest.mark.asyncio
    async def test_run_runner_success(self) -> None:
        """Test running runner successfully."""
        await self.session_manager.start()

        try:
            session_id = "test_session"
            mock_runner = MockSubprocessRunner()

            # Create session
            await self.session_manager.create_session(
                session_id=session_id,
                client_id=self.client_id,
                mode=ExecutionMode.STANDARD,
                runner=mock_runner,
            )

            # Run the runner
            await self.client_manager._run_runner(
                session_id,
                mock_runner,  # type: ignore
            )

            # Verify status was updated
            session = await self.session_manager.get_session(session_id)
            assert session is not None

        finally:
            await self.session_manager.stop()
