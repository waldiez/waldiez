# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Dev server to handle com between the react and the python part."""

# pylint: disable=too-complex,too-many-try-statements,broad-exception-caught
# pylint: disable=no-self-use,unused-argument

import asyncio
import base64
import json
import logging
import os
import sys
import traceback
from pathlib import Path
from typing import Any, Set

import nest_asyncio  # type: ignore
import websockets
from autogen.io import IOStream  # type: ignore
from pydantic import BaseModel, ConfigDict
from typing_extensions import Literal

try:
    from waldiez import WaldiezExporter, WaldiezRunner
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from waldiez import WaldiezExporter, WaldiezRunner

from waldiez.io.ws import AsyncWebsocketsIOStream

nest_asyncio.apply()  # pyright: ignore
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("waldiez-dev-server")

HERE = Path(__file__).parent
ROOT_DIR = HERE.parent
DOT_LOCAL = ROOT_DIR / ".local"
MY_DIR = DOT_LOCAL / "dev"
SAVE_PATH = MY_DIR / "save"
UPLOADS_DIR = MY_DIR / "uploads"
PUBLIC_DIR = ROOT_DIR / "public"
if PUBLIC_DIR.exists():
    UPLOADS_DIR = PUBLIC_DIR / "uploads"  # pyright: ignore
# Create directories if they don't exist
SAVE_PATH.mkdir(exist_ok=True, parents=True)
UPLOADS_DIR.mkdir(exist_ok=True, parents=True)

IncomingAction = Literal["run", "save", "upload", "convert"]
OutgoingAction = Literal[
    "runResult", "saveResult", "uploadResult", "convertResult", "error"
]


class ModelBase(BaseModel):
    """Base model to inherit."""

    model_config = ConfigDict(extra="ignore")


class IncomingMessage(ModelBase):
    """Incoming message model."""

    action: IncomingAction
    message: str


class OutgoingMessage(ModelBase):
    """Outgoing message model."""

    type: OutgoingAction
    success: bool
    message: str | None = None
    filePaths: list[str] | None = None


class WaldiezDevServer:
    """Simple websocket server for development purposes.

    WebSocket server to handle communication between React and Python parts
    """

    def __init__(self, host: str = "localhost", port: int = 7654) -> None:
        """Initialize the server.

        Parameters
        ----------
        host : str
            Hostname to bind the server to.
        port : int, optional
            Port to bind the server to.
        """
        self.host = host
        self.port = port
        self.connections: Set[websockets.ServerConnection] = set()

    async def _send(
        self,
        message: BaseModel,
        websocket: websockets.ServerConnection,
    ) -> None:
        """Send a message to the WebSocket connection.

        Parameters
        ----------
        message : BaseModel
            The message to send.
        websocket : websockets.ServerConnection
            The WebSocket connection to send the message to.
        """
        await websocket.send(json.dumps(message.model_dump(mode="json")))

    async def handler(self, websocket: websockets.ServerConnection) -> None:
        """Handle a connection and dispatch to the appropriate method.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        """
        client_id = id(websocket)
        to_log = f"Client {client_id} connected"
        logger.info(to_log)
        self.connections.add(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    action = data.get("action")
                    if not action:
                        await self.send_error(
                            websocket, "Missing 'action' field"
                        )
                        continue
                    await self.handle_action(
                        websocket,
                        action=action,
                        data=data,
                    )
                except json.JSONDecodeError:
                    await self.send_error(websocket, "Invalid JSON")
                except Exception as e:
                    logger.exception("Error handling message")
                    await self.send_error(websocket, f"Server error: {str(e)}")
        except websockets.exceptions.ConnectionClosed as e:
            to_log = (
                f"Client {client_id} connection closed: "
                f"code={e.code}, reason='{e.reason}'"
            )
            logger.info(to_log)
        except Exception as e:
            to_log = f"Client {client_id} error: {e}"
            logger.error(to_log)
        finally:
            self.connections.remove(websocket)
            to_log = f"Client {client_id} disconnected"
            logger.info(to_log)

    async def handle_action(
        self,
        websocket: websockets.ServerConnection,
        action: IncomingAction,
        data: dict[str, Any],
    ) -> None:
        """Handle an action from the client.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        action : IncomingAction
            The action to handle.
        data : dict[str, Any]
            The data associated with the action.
        """
        message: OutgoingMessage
        if action == "run":
            message = await self.handle_run(websocket, data.get("flow", ""))
        elif action == "save":
            message = await self.handle_save(websocket, data.get("flow", ""))
        elif action == "upload":
            message = await self.handle_upload(websocket, data.get("files", []))
        elif action == "convert":
            message = await self.handle_convert(
                websocket,
                data.get("flow", ""),
                data.get("to", "py"),
            )
        else:
            message = OutgoingMessage(
                type="error",
                success=False,
                message=f"Unknown action: {action}",
            )
        await self._send(message, websocket)

    async def handle_run(
        self, websocket: websockets.ServerConnection, flow: str
    ) -> OutgoingMessage:
        """Handle a 'run' action.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        flow : str
            The raw flow data to use.

        Returns
        -------
        OutgoingMessage
            The result of the operation.
        """
        logger.info("Handling run action")
        await self.handle_save(websocket, flow)
        try:
            runner = WaldiezRunner.load(MY_DIR / "save" / "flow.waldiez")
            io_steam = AsyncWebsocketsIOStream(
                websocket,
                is_async=runner.waldiez.is_async,
                uploads_root=UPLOADS_DIR,
                verbose=True,
            )
            with IOStream.set_default(io_steam):
                runner = WaldiezRunner.load(MY_DIR / "save" / "flow.waldiez")
                if runner.is_async:
                    await runner.a_run()
                else:
                    runner.run()
        except Exception as e:
            to_log = f"Error running flow: {e}"
            logger.error(traceback.format_exc())
            return OutgoingMessage(
                type="runResult", success=False, message=to_log
            )
        return OutgoingMessage(
            type="runResult", success=True, message="Flow executed successfully"
        )

    async def handle_save(
        self, websocket: websockets.ServerConnection, flow: str
    ) -> OutgoingMessage:
        """Handle a 'save' action.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        flow : str
            The raw flow data to save.

        Returns
        -------
        OutgoingMessage
            The result of the operation.
        """
        logger.info("Handling save action")

        dot_waldiez_path = SAVE_PATH / "flow.waldiez"
        if not dot_waldiez_path.exists():
            dot_waldiez_path.parent.mkdir(parents=True, exist_ok=True)
            dot_waldiez_path.touch()
        with open(dot_waldiez_path, "w", encoding="utf-8") as f:
            f.write(flow)
        to_log = f"Flow saved to {dot_waldiez_path}"
        logger.info(to_log)
        return OutgoingMessage(type="saveResult", success=True, message=to_log)

    async def handle_upload(
        self,
        websocket: websockets.ServerConnection,
        files: list[dict[str, str]],
    ) -> OutgoingMessage:
        """Handle an 'upload' action with base64-encoded files.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        files : list[dict[str, str]]
            List of files to upload, each with a 'name' and 'content' field.

        Returns
        -------
        OutgoingMessage
            The result of the operation.
        """
        to_log = f"Handling upload action for {len(files)} files"
        logger.info(to_log)
        file_paths: list[str] = []

        for file_data in files:
            filename = file_data.get("name")
            content_b64 = file_data.get("content")

            if not filename or not content_b64:
                continue

            try:
                content = base64.b64decode(content_b64)
                file_path = UPLOADS_DIR / filename

                with open(file_path, "wb") as f:
                    f.write(content)

                file_paths.append(str(file_path))
                to_log = f"File {filename} saved to {file_path}"
                logger.info(to_log)
            except Exception as e:
                to_log = f"Error saving file {filename}: {e}"
                logger.error(to_log)
        return OutgoingMessage(
            type="uploadResult",
            success=True,
            message="Files uploaded successfully",
            filePaths=file_paths,
        )

    async def handle_convert(
        self, websocket: websockets.ServerConnection, flow: str, to: str
    ) -> OutgoingMessage:
        """Handle a 'convert' action.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        flow : str
            The raw flow data to convert.
        to : str
            The target format to convert to (e.g., 'py' or 'ipynb').

        Returns
        -------
        OutgoingMessage
            The result of the operation.
        """
        to_log = f"Handling convert action to {to}"
        logger.info(to_log)
        # Simple implementation that just creates a placeholder file
        extension = ".py" if to == "py" else ".ipynb"
        output_path = SAVE_PATH / f"converted_flow{extension}"
        await self.handle_save(websocket, flow)
        try:
            exporter = WaldiezExporter.load(MY_DIR / "save" / "flow.waldiez")
            exporter.export(output_path, force=True)
        except Exception as e:
            to_log = f"Error converting flow: {e}"
            logger.error(to_log)
            return OutgoingMessage(
                type="convertResult", success=False, message=to_log
            )
        return OutgoingMessage(
            type="convertResult",
            success=True,
            message=f"Flow converted successfully to {output_path}",
        )

    async def send_error(
        self, websocket: websockets.ServerConnection, message: str
    ) -> None:
        """Send an error message to the client.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        message : str
            The error message to send.
        """
        await websocket.send(
            json.dumps(
                {
                    "type": "error",
                    "success": False,
                    "message": message,
                }
            )
        )

    async def broadcast(self, message: str) -> None:
        """Send a message to all connected clients.

        Parameters
        ----------
        message : str
            The message to send.
        """
        if self.connections:
            await asyncio.gather(
                *[connection.send(message) for connection in self.connections]
            )

    async def serve(self) -> None:
        """Start the WebSocket server."""
        async with websockets.serve(self.handler, self.host, self.port):
            to_log = f"Server started at ws://{self.host}:{self.port}"
            logger.info(to_log)
            await asyncio.Future()  # Run forever


def get_default_dev_port() -> int:
    """Get the development port from the environment variable or default value.

    Returns
    -------
    int
        The development port.
    """
    fallback_port = int(os.environ.get("DEV_PORT", "7654"))
    dev_ws_url = os.environ.get("VITE_DEV_WS_URL", "")
    if dev_ws_url:
        try:
            return int(dev_ws_url.split(":")[-1])
        except ValueError:
            logger.error("Invalid port number in VITE_DEV_WS_URL")
            return fallback_port
    return fallback_port


if __name__ == "__main__":
    dev_port = get_default_dev_port()
    if "--port" in sys.argv:
        try:
            port_index = sys.argv.index("--port") + 1
            dev_port = int(sys.argv[port_index])  # pyright: ignore
        except (ValueError, IndexError):
            logger.error("Invalid port number provided.")
            sys.exit(1)
    server = WaldiezDevServer(port=dev_port)
    asyncio.run(server.serve())
