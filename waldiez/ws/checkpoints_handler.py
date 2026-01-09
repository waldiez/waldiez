# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportUnnecessaryIsInstance=false,reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false,reportUnknownArgumentType=false

"""Checkpoints manager."""

import json
from typing import Any, Callable

import anyio.to_thread

from waldiez.storage import (
    StorageManager,
    WaldiezCheckpoint,
    WaldiezCheckpointInfo,
)

from .models import (
    DeleteCheckpointRequest,
    DeleteCheckpointResponse,
    GetCheckpointsRequest,
    GetCheckpointsResponse,
    SetCheckpointRequest,
    SetCheckpointResponse,
)


class CheckpointsHandler:
    """Checkpoints handler."""

    storage_manager: StorageManager
    _error_to_response: Callable[[Exception, str | None], dict[str, Any]]

    # error: Exception, request_id: str | None

    def __init__(
        self,
        storage_manager: StorageManager,
        error_to_response: Callable[[Exception, str | None], dict[str, Any]],
    ) -> None:
        """Initialize the handler instance."""
        self.storage_manager = storage_manager
        self._error_to_response = error_to_response

    async def handle_get_checkpoints(
        self, msg: GetCheckpointsRequest
    ) -> dict[str, Any]:
        """Handle getting a flow's checkpoints.

        Parameters
        ----------
        msg : GetCheckpointsRequest
            The get request.

        Returns
        -------
        dict[str, Any]
            The flow's checkpoints.
        """
        return await anyio.to_thread.run_sync(self._handle_get_checkpoints, msg)

    async def handle_save_checkpoint(
        self, msg: SetCheckpointRequest
    ) -> dict[str, Any]:
        """Handle saving a checkpoint.

        Parameters
        ----------
        msg : SetCheckpointRequest
            The save request.

        Returns
        -------
        dict[str, Any]
            The updated checkpoint.
        """
        return await anyio.to_thread.run_sync(self._handle_save_checkpoint, msg)

    async def handle_delete_checkpoint(
        self, msg: DeleteCheckpointRequest
    ) -> dict[str, Any]:
        """Handle deleting a checkpoint.

        Parameters
        ----------
        msg : DeleteCheckpointRequest

        Returns
        -------
        dict[str, Any]
            The result of the action.
        """
        return await anyio.to_thread.run_sync(
            self._handle_delete_checkpoint, msg
        )

    def _handle_get_checkpoints(
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
                ValueError("Invalid flow name"),
                msg.request_id,
            )
        checkpoints = self.storage_manager.history(flow_name)
        response = GetCheckpointsResponse(
            checkpoints=checkpoints, request_id=msg.request_id
        ).model_dump(mode="json")
        response["payload"] = response["checkpoints"]
        return response

    def _handle_save_checkpoint(
        self, msg: SetCheckpointRequest
    ) -> dict[str, Any]:
        payload_dict = _get_payload_dict(msg.payload)
        if not payload_dict:
            return self._error_to_response(
                ValueError("Invalid request"),
                msg.request_id,
            )
        checkpoint_info = _get_checkpoint_info(
            payload_dict, self.storage_manager
        )
        if not checkpoint_info:
            return self._error_to_response(
                ValueError("Invalid request"),
                msg.request_id,
            )
        new_state = _update_checkpoint(
            info=checkpoint_info, payload_dict=payload_dict
        )
        if not new_state:
            return self._error_to_response(
                ValueError("Invalid request"),
                msg.request_id,
            )
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
        response = SetCheckpointResponse(
            checkpoint=cp_dict,
            request_id=msg.request_id,
        ).model_dump(mode="json")
        response["payload"] = response["checkpoint"]
        return response

    def _handle_delete_checkpoint(
        self, msg: DeleteCheckpointRequest
    ) -> dict[str, Any]:
        payload_dict = _get_payload_dict(msg.payload)
        if not payload_dict:
            return self._error_to_response(
                ValueError("Invalid request"),
                msg.request_id,
            )
        checkpoint_info = _get_checkpoint_info(
            payload_dict, self.storage_manager
        )
        if not checkpoint_info:
            return self._error_to_response(
                ValueError("Invalid request"),
                msg.request_id,
            )
        self.storage_manager.delete(
            session_name=checkpoint_info.session_name,
            timestamp=checkpoint_info.timestamp,
        )
        response = DeleteCheckpointResponse(
            checkpoint=checkpoint_info.id,
            request_id=msg.request_id,
        ).model_dump(mode="json")
        response["payload"] = response["checkpoint"]
        return response


def _get_payload_dict(payload: Any) -> dict[str, Any]:
    payload_dict: dict[str, Any] = {}
    if isinstance(payload, str):
        try:
            parsed_payload = json.loads(payload)
        except BaseException:  # pylint: disable=broad-exception-caught
            return {}
        if not isinstance(parsed_payload, dict):
            return {}
        payload_dict = parsed_payload
    else:
        payload_dict = payload
    return payload_dict


# noinspection PyBroadException,PyUnusedLocal
def _get_checkpoint_info(
    payload_dict: dict[str, Any],
    storage_manager: StorageManager,
) -> WaldiezCheckpointInfo | None:
    flow_name = ""
    flow_name = str(
        payload_dict.get("flow_name", payload_dict.get("flowName", ""))
    )
    if not flow_name:
        return None
    checkpoint = payload_dict.get("checkpoint", {})
    if not checkpoint or not isinstance(checkpoint, (str, dict)):
        return None
    if isinstance(checkpoint, dict):
        cp_ts_str = checkpoint.get(
            "id", str(checkpoint.get("timestamp", "latest"))
        )
    else:
        cp_ts_str = checkpoint
    if cp_ts_str == "latest":
        cp_info = storage_manager.get_latest_checkpoint(flow_name)
    else:
        cp_ts = WaldiezCheckpoint.parse_timestamp(cp_ts_str)
        if not cp_ts:
            return None
        cp_info = storage_manager.get(flow_name, cp_ts)
    if not cp_info:
        return None
    return cp_info


def _update_checkpoint(
    info: WaldiezCheckpointInfo,
    payload_dict: dict[str, Any],
) -> dict[str, Any] | None:
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
    new_state = info.checkpoint.state
    if have_messages:
        new_state["messages"] = messages
    if have_context_variables:
        new_state["context_variables"] = messages
    return new_state
