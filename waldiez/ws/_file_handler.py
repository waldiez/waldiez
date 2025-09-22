# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Files related request handler."""

import json
import logging
from pathlib import Path
from typing import Any

from waldiez.exporter import WaldiezExporter
from waldiez.models import Waldiez

from .models import (
    ConvertWorkflowRequest,
    ConvertWorkflowResponse,
    SaveFlowRequest,
    SaveFlowResponse,
)


class FileRequestHandler:
    """Handles file-related requests."""

    @staticmethod
    def handle_save_request(
        msg: SaveFlowRequest,
        workspace_dir: Path,
        client_id: str,
        logger: logging.Logger,
    ) -> dict[str, Any]:
        """Handle save flow request.

        Parameters
        ----------
        msg : SaveFlowRequest
            The save flow request message.
        workspace_dir : Path
            The workspace directory.
        client_id : str
            The client ID.
        logger : logging.Logger
            The logger instance.

        Returns
        -------
        dict[str, Any]
            The response dictionary.
        """
        path = msg.path or f"waldiez_{client_id}.waldiez"
        try:
            output_path = resolve_output_path(
                path,
                workspace_dir=workspace_dir,
                expected_ext="waldiez",
            )
        except ValueError as exc:
            logger.error("Error resolving output path: %s", exc)
            return SaveFlowResponse.fail(
                error=f"Invalid output path: {exc}",
                path=path,
            ).model_dump(mode="json")
        # pylint: disable=too-many-try-statements
        try:
            if output_path.exists() and not msg.force:
                return SaveFlowResponse.fail(
                    error=f"File exists: {output_path}",
                    file_path=str(output_path.relative_to(workspace_dir)),
                ).model_dump(mode="json")

            # Parent dir already created by resolve_output_path
            output_path.write_text(msg.data, encoding="utf-8")

            return SaveFlowResponse.ok(
                path=str(output_path.relative_to(workspace_dir))
            ).model_dump(mode="json")
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error saving flow: %s", e)
            return SaveFlowResponse.fail(error=str(e)).model_dump(mode="json")

    @staticmethod
    def handle_convert_request(
        msg: ConvertWorkflowRequest,
        client_id: str,
        workspace_dir: Path,
        logger: logging.Logger,
    ) -> dict[str, Any]:
        """Handle a convert workflow request.

        Parameters
        ----------
        msg : ConvertWorkflowRequest
            The convert workflow request message.
        client_id : str
            The client ID.
        workspace_dir : Path
            The workspace directory.
        logger : logging.Logger
            The logger instance.

        Returns
        -------
        dict[str, Any]
            The response dictionary.
        """
        target_format = (msg.format or "").strip().lower()
        if target_format not in {"py", "ipynb"}:
            return ConvertWorkflowResponse.fail(
                error=f"Unsupported target format: {target_format}",
                format=target_format,
            ).model_dump(mode="json")

        try:
            waldiez_data = Waldiez.from_dict(json.loads(msg.data))
        except Exception as e:  # pylint: disable=broad-exception-caught
            return ConvertWorkflowResponse.fail(
                error=f"Invalid flow_data: {e}",
                format=target_format,
            ).model_dump(mode="json")

        try:
            # Use normalized target_format for default name
            path = msg.path or f"waldiez_{client_id}.{target_format}"
            output_path = resolve_output_path(
                path,
                workspace_dir=workspace_dir,
                expected_ext=target_format,
            )
        except ValueError as exc:
            logger.error("Error resolving output path: %s", exc)
            return ConvertWorkflowResponse.fail(
                error=f"Invalid output path: {exc}",
                format=target_format,
            ).model_dump(mode="json")

        try:
            exporter = WaldiezExporter(waldiez_data)
            exporter.export(path=output_path, force=True, structured_io=True)

            return ConvertWorkflowResponse.ok(
                format=target_format,
                path=str(output_path.relative_to(workspace_dir)),
            ).model_dump(mode="json")
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error converting workflow: %s", e)
            return ConvertWorkflowResponse.fail(
                error=str(e), format=target_format
            ).model_dump(mode="json")


def resolve_output_path(
    filename: str,
    workspace_dir: Path,
    expected_ext: str | None = None,
) -> Path:
    """
    Resolve output path inside the workspace.

    Parameters
    ----------
    filename : str
        Provided filename (may be relative or absolute).
    workspace_dir : Path
        The workspace directory to resolve the output path against.
    expected_ext : str | None
        If provided, ensure the filename ends with this extension.

    Returns
    -------
    Path
        Resolved absolute path, with parent directories created.

    Raises
    ------
    ValueError
        If the output path is outside the workspace.
    """
    # Normalize workspace_dir to an absolute path
    workspace_dir = workspace_dir.resolve()

    output_path = Path(filename)
    if not output_path.is_absolute():
        output_path = workspace_dir / output_path

    if expected_ext and output_path.suffix != f".{expected_ext}":
        output_path = output_path.with_suffix(f".{expected_ext}")

    output_path = output_path.resolve()

    # Ensure output_path is a subpath of workspace_dir
    try:
        output_path.relative_to(workspace_dir)
    except ValueError as exc:
        raise ValueError(
            f"Output path {output_path} is outside workspace {workspace_dir}"
        ) from exc

    output_path.parent.mkdir(parents=True, exist_ok=True)
    return output_path
