# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=broad-exception-caught,no-member,invalid-name
# pyright: reportUnknownVariableType=false,reportAny=false
# pyright: reportDeprecated=false, reportUnannotatedClassAttribute=false
"""Session management models for WebSocket workflow execution."""

import json
import time
import uuid
from enum import Enum
from pathlib import Path
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, ValidationError


class WorkflowStatus(str, Enum):
    """Workflow execution status."""

    IDLE = "idle"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    STEP_WAITING = "step_waiting"
    INPUT_WAITING = "input_waiting"
    STOPPING = "stopping"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExecutionMode(str, Enum):
    """Workflow execution modes."""

    STANDARD = "standard"
    STEP_BY_STEP = "step_by_step"
    SUBPROCESS = "subprocess"


class BaseWaldiezMessage(BaseModel):
    """Base class for all Waldiez WebSocket messages."""

    message_id: str = Field(
        default_factory=lambda: f"msg_{time.monotonic_ns()}",
    )
    timestamp: float = Field(default_factory=time.time)

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        extra="ignore",
        json_encoders={
            Path: str,
            Enum: lambda v: v.value,
        },
    )


class BaseRequest(BaseWaldiezMessage):
    """Base class for client requests."""


class BaseResponse(BaseWaldiezMessage):
    """Base class for server responses."""

    request_id: str | None = None
    success: bool = True
    error: str | None = None

    @classmethod
    def ok(cls, **kwargs: Any) -> "BaseResponse":
        """Create a successful response.

        Parameters
        ----------
        kwargs : Any
            Additional keyword arguments to include in the response.

        Returns
        -------
        BaseResponse
            The created successful response.

        """
        kwargs.setdefault("success", True)
        kwargs.setdefault("error", None)
        return cls(**kwargs)

    @classmethod
    def fail(cls, error: str, **kwargs: Any) -> "BaseResponse":
        """
        Create a failed response.

        Parameters
        ----------
        error : str
            The error message.
        kwargs : Any
            Additional keyword arguments to include in the response.

        Returns
        -------
        BaseResponse
            The created failed response.

        """
        kwargs.update({"success": False, "error": error})
        return cls(**kwargs)


class BaseNotification(BaseWaldiezMessage):
    """Base class for server notifications (no response expected)."""


# ========================================
# CLIENT-TO-SERVER MESSAGES (REQUESTS)
# ========================================


class SaveFlowRequest(BaseRequest):
    """Request to save a workflow."""

    type: Literal["save"] = "save"
    data: str  # JSON string of workflow
    path: str | None = None
    force: bool = False


class RunWorkflowRequest(BaseRequest):
    """Request to run a workflow in standard mode."""

    type: Literal["run"] = "run"
    data: str  # JSON string of workflow
    path: str | None = None


class StepRunWorkflowRequest(BaseRequest):
    """Request to run a workflow in step-by-step mode."""

    type: Literal["step_run"] = "step_run"
    data: str  # JSON string of workflow
    breakpoints: list[str] = Field(default_factory=list)
    checkpoint: str | None = None
    path: str | None = None


class StepControlRequest(BaseRequest):
    """Request to control step-by-step execution."""

    type: Literal["step_control"] = "step_control"
    action: Literal[
        "continue",
        "step",
        "run",
        "quit",
        "info",
        "help",
        "stats",
        "",
        "c",
        "s",
        "r",
        "q",
        "i",
        "h",
        "?",
        "st",
    ]
    session_id: str


class BreakpointRequest(BaseRequest):
    """Request to manage breakpoints."""

    type: Literal["breakpoint_control"] = "breakpoint_control"
    action: Literal["add", "remove", "list", "clear"]
    event_type: str | None = None  # Required for add/remove
    session_id: str

    @property
    def response(self) -> Literal["added", "removed", "list", "cleared"]:
        """Get the response message for the breakpoint action."""
        if self.action == "remove":
            return "removed"
        if self.action == "list":
            return "list"
        if self.action == "clear":
            return "cleared"
        return "added"


class UserInputResponse(BaseRequest):
    """User input response for workflow execution."""

    type: Literal["user_input"] = "user_input"
    request_id: str
    data: Any
    session_id: str


class StopWorkflowRequest(BaseRequest):
    """Request to stop workflow execution."""

    type: Literal["stop"] = "stop"
    session_id: str
    force: bool = False


class StopWorkflowResponse(BaseResponse):
    """Response to stop workflow request."""

    session_id: str
    type: Literal["stop_response"] = "stop_response"
    error: str | None = None
    forced: bool = False


class ConvertWorkflowRequest(BaseRequest):
    """Request to convert workflow to different format."""

    type: Literal["convert"] = "convert"
    data: str
    format: Literal["py", "ipynb"]
    path: str | None = None


class UploadFileRequest(BaseRequest):
    """Request to upload a file."""

    type: Literal["upload_file"] = "upload_file"
    filename: str
    file_data: str  # Base64 encoded
    file_size: int
    mime_type: str | None = None


class PingRequest(BaseRequest):
    """Ping request for connection testing."""

    type: Literal["ping"] = "ping"
    echo_data: dict[str, Any] = Field(default_factory=dict)


class GetStatusRequest(BaseRequest):
    """Request current server/workflow status."""

    type: Literal["get_status"] = "get_status"
    session_id: str | None = None


class GetCheckpointsRequest(BaseRequest):
    """Request previous checkpoints for a flow."""

    request_id: str
    type: Literal["get_checkpoints"] = "get_checkpoints"
    payload: str | dict[str, Any]


class SetCheckpointRequest(BaseRequest):
    """Save a checkpoint."""

    request_id: str
    type: Literal["set_checkpoint"] = "set_checkpoint"
    payload: str | dict[str, Any]


class DeleteCheckpointRequest(BaseRequest):
    """Delete a checkpoint."""

    request_id: str
    type: Literal["delete_checkpoint"] = "delete_checkpoint"
    payload: str | dict[str, Any]


# ========================================
# SERVER-TO-CLIENT MESSAGES (RESPONSES)
# ========================================


class SaveFlowResponse(BaseResponse):
    """Response to save flow request."""

    type: Literal["save_response"] = "save_response"
    path: str | None = None
    error: str | None = None


class RunWorkflowResponse(BaseResponse):
    """Response to run workflow request."""

    type: Literal["run_response"] = "run_response"
    session_id: str
    error: str | None = None


class StepRunWorkflowResponse(BaseResponse):
    """Response to step run workflow request."""

    type: Literal["step_run_response"] = "step_run_response"
    session_id: str
    breakpoints: list[str]
    checkpoint: str | None = None
    error: str | None = None


class StepControlResponse(BaseResponse):
    """Response to step control request."""

    type: Literal["step_control_response"] = "step_control_response"
    action: str
    result: str
    session_id: str


class BreakpointResponse(BaseResponse):
    """Response to breakpoint management."""

    type: Literal["breakpoint_response"] = "breakpoint_response"
    action: str
    breakpoints: list[str] = Field(default_factory=list)
    session_id: str
    error: str | None = None


class ConvertWorkflowResponse(BaseResponse):
    """Response to convert workflow request."""

    type: Literal["convert_response"] = "convert_response"
    format: str
    path: str | None = None
    error: str | None = None


class UploadFileResponse(BaseResponse):
    """Response to file upload."""

    type: Literal["upload_file_response"] = "upload_file_response"
    path: str | None = None
    size: int | None = None
    error: str | None = None


class PongResponse(BaseResponse):
    """Response to ping."""

    type: Literal["pong"] = "pong"
    echo_data: dict[str, Any] = Field(default_factory=dict)
    server_time: float = Field(default_factory=time.time)


class StatusResponse(BaseResponse):
    """Response with current status."""

    type: Literal["status_response"] = "status_response"
    server_status: dict[str, Any]
    workflow_status: WorkflowStatus | None = None
    session_id: str | None = None


class GetCheckpointsResponse(BaseResponse):
    """Return the checkpoints of a flow."""

    type: Literal["get_checkpoints"] = "get_checkpoints"
    checkpoints: dict[str, Any] = Field(default_factory=dict)


class SetCheckpointResponse(BaseResponse):
    """Save a checkpoint of a flow."""

    type: Literal["set_checkpoint"] = "set_checkpoint"
    checkpoint: dict[str, Any] = Field(default_factory=dict)


class DeleteCheckpointResponse(BaseResponse):
    """Delete a checkpoint of a flow."""

    type: Literal["delete_checkpoint"] = "delete_checkpoint"
    checkpoint: str


class ErrorResponse(BaseResponse):
    """Generic error response."""

    type: Literal["error"] = "error"
    error_code: int
    error_type: str
    details: dict[str, Any] = Field(default_factory=dict)
    success: bool = False


# ========================================
# SERVER-TO-CLIENT NOTIFICATIONS
# ========================================


class WorkflowStatusNotification(BaseNotification):
    """Notification of workflow status change."""

    type: Literal["workflow_status"] = "workflow_status"
    session_id: str
    status: WorkflowStatus
    mode: ExecutionMode
    details: str | None = None

    @classmethod
    def make(
        cls,
        session_id: str,
        status: WorkflowStatus,
        mode: ExecutionMode,
        details: str | None = None,
    ) -> "WorkflowStatusNotification":
        """Create a workflow status notification.

        Parameters
        ----------
        session_id : str
            The session ID.
        status : WorkflowStatus
            The workflow status.
        mode : ExecutionMode
            The execution mode.
        details : str | None
            Additional details about the status.

        Returns
        -------
        WorkflowStatusNotification
            The created workflow status notification.
        """
        return cls(
            session_id=session_id,
            status=status,
            mode=mode,
            details=details,
        )


class WorkflowOutputNotification(BaseNotification):
    """Notification of workflow output."""

    type: Literal["workflow_output"] = "workflow_output"
    session_id: str
    stream: Literal["stdout", "stderr"]
    content: str
    output_type: Literal["text", "structured", "debug"] = "text"

    @classmethod
    def stdout(cls, session_id: str, text: str) -> "WorkflowOutputNotification":
        """Create a workflow output notification for stdout.

        Parameters
        ----------
        session_id : str
            The session ID.
        text : str
            The output text.

        Returns
        -------
        WorkflowOutputNotification
            The created workflow output notification.
        """
        return cls(session_id=session_id, stream="stdout", content=text)

    @classmethod
    def stderr(cls, session_id: str, text: str) -> "WorkflowOutputNotification":
        """Create a workflow output notification for stderr.

        Parameters
        ----------
        session_id : str
            The session ID.
        text : str
            The output text.

        Returns
        -------
        WorkflowOutputNotification
            The created workflow output notification.
        """
        return cls(session_id=session_id, stream="stderr", content=text)


class WorkflowEventNotification(BaseNotification):
    """Notification of workflow event (for step-by-step)."""

    type: Literal["workflow_event"] = "workflow_event"
    session_id: str
    event_data: dict[str, Any]
    event_count: int
    should_break: bool = False


class UserInputRequestNotification(BaseNotification):
    """Notification requesting user input."""

    type: Literal["input_request"] = "input_request"
    session_id: str
    request_id: str
    prompt: str
    password: bool = False
    timeout: float = 120.0


class BreakpointNotification(BaseNotification):
    """Notification about breakpoint changes."""

    type: Literal["breakpoint_notification"] = "breakpoint_notification"
    session_id: str
    action: Literal["added", "removed", "cleared", "list"]
    event_type: str | None = None
    breakpoints: list[str] = Field(default_factory=list)
    message: str | None = None


class WorkflowCompletionNotification(BaseNotification):
    """Notification of workflow completion."""

    type: Literal["workflow_completion"] = "workflow_completion"
    session_id: str
    success: bool
    exit_code: int | None = None
    results: list[dict[str, Any]] = Field(default_factory=list)
    execution_time: float | None = None
    error: str | None = None


class StepDebugNotification(BaseNotification):
    """Notification for step-by-step debug information."""

    type: Literal["step_debug"] = "step_debug"
    session_id: str
    debug_type: Literal["stats", "help", "error", "info"]
    data: dict[str, Any]


class ConnectionNotification(BaseNotification):
    """Notification about connection status."""

    type: Literal["connection"] = "connection"
    status: Literal["connected", "disconnected", "error"]
    client_id: str
    server_time: float = Field(default_factory=time.time)
    message: str | None = None


# ========================================
# SUBPROCESS-SPECIFIC MODELS
# ========================================


class SubprocessOutputNotification(BaseNotification):
    """Notification from subprocess execution."""

    type: Literal["subprocess_output"] = "subprocess_output"
    session_id: str
    stream: Literal["stdout", "stderr"]
    content: str
    subprocess_type: Literal["output", "error", "debug"] = "output"
    context: dict[str, Any] = Field(default_factory=dict)


class SubprocessInputRequestNotification(BaseNotification):
    """Input request from subprocess."""

    type: Literal["subprocess_input_request"] = "subprocess_input_request"
    session_id: str
    request_id: str
    prompt: str
    timeout: float = 120.0
    password: bool = False
    context: dict[str, Any] = Field(default_factory=dict)


class SubprocessCompletionNotification(BaseNotification):
    """Subprocess execution completion."""

    type: Literal["subprocess_completion"] = "subprocess_completion"
    session_id: str
    success: bool
    exit_code: int
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


# ========================================
# UNION TYPES FOR MESSAGE PARSING
# ========================================

# Client-to-Server Messages
ClientMessage = Annotated[
    Union[
        SaveFlowRequest,
        RunWorkflowRequest,
        StepRunWorkflowRequest,
        StepControlRequest,
        BreakpointRequest,
        UserInputResponse,
        StopWorkflowRequest,
        ConvertWorkflowRequest,
        UploadFileRequest,
        PingRequest,
        GetStatusRequest,
        GetCheckpointsRequest,
        SetCheckpointRequest,
        DeleteCheckpointRequest,
    ],
    Field(discriminator="type"),
]

# Server-to-Client Messages
ServerMessage = Annotated[
    Union[
        # Responses
        SaveFlowResponse,
        RunWorkflowResponse,
        StepRunWorkflowResponse,
        StopWorkflowResponse,
        StepControlResponse,
        BreakpointResponse,
        BreakpointNotification,
        ConvertWorkflowResponse,
        UploadFileResponse,
        PongResponse,
        StatusResponse,
        GetCheckpointsResponse,
        SetCheckpointResponse,
        DeleteCheckpointResponse,
        ErrorResponse,
        # Notifications
        WorkflowStatusNotification,
        WorkflowOutputNotification,
        WorkflowEventNotification,
        UserInputRequestNotification,
        WorkflowCompletionNotification,
        StepDebugNotification,
        ConnectionNotification,
        SubprocessOutputNotification,
        SubprocessInputRequestNotification,
        SubprocessCompletionNotification,
    ],
    Field(discriminator="type"),
]


class _ServerMessageWrapper(BaseModel):
    """Wrapper for server messages to handle discriminators."""

    # noinspection PyTypeHints
    message: ServerMessage


class _ClientMessageWrapper(BaseModel):
    """Wrapper for client messages to handle discriminators."""

    # noinspection PyTypeHints
    message: ClientMessage


# All messages
WaldiezWsMessage = Annotated[
    Union[ClientMessage, ServerMessage],
    Field(discriminator="type"),
]


# ========================================
# UTILITY FUNCTIONS
# ========================================


# noinspection PyTypeHints,DuplicatedCode
def parse_client_message(data: str | dict[str, Any]) -> ClientMessage:
    """Parse client message from JSON string or dict.

    Parameters
    ----------
    data : str | dict[str, Any]
        Message data

    Returns
    -------
    ClientMessage
        Parsed client message

    Raises
    ------
    ValueError
        If message cannot be parsed
    """
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid message format: {e}") from e
    try:
        return _ClientMessageWrapper.model_validate({"message": data}).message
    except ValidationError as e:
        raise ValueError(f"Invalid client message: {e}") from e


# noinspection PyTypeHints,DuplicatedCode
def parse_server_message(data: str | dict[str, Any]) -> ServerMessage:
    """Parse server message from JSON string or dict.

    Parameters
    ----------
    data : str | dict[str, Any]
        Message data

    Returns
    -------
    ServerMessage
        Parsed server message

    Raises
    ------
    ValueError
        If message cannot be parsed
    """
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid message format: {e}") from e
    try:
        return _ServerMessageWrapper.model_validate({"message": data}).message
    except ValidationError as e:
        raise ValueError(f"Invalid server message: {e}") from e


def create_error_response(
    error_message: str,
    error_code: int = 500,
    error_type: str = "InternalError",
    request_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> ErrorResponse:
    """Create standardized error response.

    Parameters
    ----------
    error_message : str
        Error message
    error_code : int
        Error code
    error_type : str
        Error type
    request_id : str | None
        Request ID if this is response to a request
    details : dict[str, Any] | None
        Additional error details

    Returns
    -------
    ErrorResponse
        Standardized error response
    """
    return ErrorResponse(
        request_id=request_id,
        error_code=error_code,
        error_type=error_type,
        error=error_message,
        details=details or {},
    )


def create_session_id() -> str:
    """Create a new session ID.

    Returns
    -------
    str
        New session ID
    """
    return f"session_{uuid.uuid4().hex[:12]}"


# ========================================
# MESSAGE TYPE CONSTANTS
# ========================================

CLIENT_MESSAGE_TYPES = {
    "save",
    "run",
    "step_run",
    "step_control",
    "breakpoint_control",
    "user_input",
    "stop",
    "convert",
    "upload_file",
    "ping",
    "get_status",
}

SERVER_MESSAGE_TYPES = {
    # Responses
    "save_response",
    "run_response",
    "step_run_response",
    "step_control_response",
    "breakpoint_response",
    "convert_response",
    "upload_file_response",
    "pong",
    "status_response",
    "error",
    # Notifications
    "workflow_status",
    "workflow_output",
    "workflow_event",
    "input_request",
    "breakpoint_notification",
    "workflow_completion",
    "step_debug",
    "connection",
    "subprocess_output",
    "subprocess_input_request",
    "subprocess_completion",
}

ALL_MESSAGE_TYPES = CLIENT_MESSAGE_TYPES | SERVER_MESSAGE_TYPES


class SessionState(BaseModel):
    """State information for a workflow session."""

    session_id: str
    client_id: str
    status: WorkflowStatus
    mode: ExecutionMode
    start_time: int = Field(default_factory=time.monotonic_ns)
    end_time: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    # Runtime fields (not serialized)
    runner: Any = Field(default=None, exclude=True)
    temp_file: Path | None = Field(default=None, exclude=True)

    @property
    def duration(self) -> float:
        """Get session duration in seconds."""
        end = self.end_time or time.monotonic_ns()
        return (end - self.start_time) / 1_000_000_000

    @property
    def is_active(self) -> bool:
        """Check if session is currently active."""
        return self.status in {
            WorkflowStatus.STARTING,
            WorkflowStatus.RUNNING,
            WorkflowStatus.PAUSED,
            WorkflowStatus.STEP_WAITING,
            WorkflowStatus.INPUT_WAITING,
        }

    @property
    def is_completed(self) -> bool:
        """Check if session has completed (successfully or not)."""
        return self.status in {
            WorkflowStatus.COMPLETED,
            WorkflowStatus.FAILED,
            WorkflowStatus.CANCELLED,
        }

    def update_status(self, new_status: WorkflowStatus) -> None:
        """Update session status and set end time if completed.

        Parameters
        ----------
        new_status : WorkflowStatus
            The new status to set.
        """
        self.status = new_status
        if self.is_completed and not self.end_time:
            self.end_time = time.monotonic_ns()

    def get_execution_summary(self) -> dict[str, Any]:
        """Get a summary of session execution.

        Returns
        -------
        dict[str, Any]
            A dictionary containing session execution summary.
        """
        return {
            "session_id": self.session_id,
            "client_id": self.client_id,
            "status": self.status.value,
            "mode": self.mode.value,
            "duration_seconds": self.duration,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "is_active": self.is_active,
            "is_completed": self.is_completed,
        }
