# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Dev server to handle com between the react and the python part."""

# pylint: disable=too-complex,too-many-try-statements,broad-exception-caught
# pylint: disable=no-self-use,unused-argument

import asyncio
import base64
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

import nest_asyncio  # type: ignore
import websockets
from autogen.events import BaseEvent  # type: ignore
from autogen.io import IOStream  # type: ignore
from pydantic import BaseModel
from typing_extensions import Literal

try:
    from waldiez import WaldiezExporter, WaldiezRunner
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from waldiez import WaldiezExporter, WaldiezRunner

nest_asyncio.apply()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("waldiez-dev-server")

HERE = Path(__file__).parent
ROOT_DIR = HERE.parent
DOT_LOCAL = ROOT_DIR / ".local"
MY_DIR = DOT_LOCAL / "dev"
SAVE_PATH = MY_DIR / "save"
UPLOAD_DIR = MY_DIR / "uploads"
# Create directories if they don't exist
SAVE_PATH.mkdir(exist_ok=True, parents=True)
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

IncomingAction = Literal["run", "save", "upload", "convert"]
OutgoingAction = Literal[
    "runResult", "saveResult", "uploadResult", "convertResult"
]


class UserInputPrompt(BaseModel):
    """User input prompt model."""

    type: str = "input"
    prompt: str


class UserResponse(BaseModel):
    """User response model."""

    type: str = "input"
    input: str


class PrintMessage(BaseModel):
    """Message to be printed."""

    type: str = "print"
    message: str


class IncomingMessage(BaseModel):
    """Incoming message model."""

    action: IncomingAction
    message: str


class OutgoingMessage(BaseModel):
    """Outgoing message model."""

    type: OutgoingAction
    success: bool
    message: str | None = None
    filePaths: List[str] | None = None


class AsyncIOWebsockets(IOStream):
    """AsyncIO WebSocket class to handle communication."""

    def __init__(self, websocket: websockets.ServerConnection) -> None:
        """Initialize the AsyncIOWebsockets instance.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        """
        super().__init__(websocket)
        self.websocket = websocket

    def print(self, *args: Any, **kwargs: Any) -> None:
        """Print to the WebSocket connection.

        Parameters
        ----------
        args : tuple
            The arguments to print.
        kwargs : dict
            The keyword arguments to print.
        """
        sep = kwargs.get("sep", " ")
        end = kwargs.get("end", "\n")
        msg = sep.join(str(arg) for arg in args) + end
        message_dump = PrintMessage(message=msg).model_dump(mode="json")
        asyncio.run(
            self.websocket.send(json.dumps(message_dump)),
        )

    def send(self, message: BaseEvent) -> None:
        """Send a message to the WebSocket connection.

        Parameters
        ----------
        message : str
            The message to send.
        """
        asyncio.run(
            self.websocket.send(json.dumps(message.model_dump(mode="json"))),
        )

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Get input from the WebSocket connection.

        Parameters
        ----------
        prompt : str
            The prompt to display.
        password : bool
            Whether to hide the input.

        Returns
        -------
        str
            The user input.
        """
        prompt = UserInputPrompt(prompt=prompt).model_dump_json()
        asyncio.run(
            self.websocket.send(prompt),
        )
        response = asyncio.run(self.websocket.recv())
        if isinstance(response, bytes):
            response = response.decode("utf-8")
        try:
            user_response = UserResponse.model_validate_json(response)
            return user_response.input
        except Exception:
            logger.error("Error parsing user input response")
            return response


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
        data: Dict[str, Any],
    ) -> None:
        """Handle an action from the client.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        action : IncomingAction
            The action to handle.
        data : Dict[str, Any]
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
            io_steam = AsyncIOWebsockets(websocket)
            with IOStream.set_default(io_steam):
                runner = WaldiezRunner.load(MY_DIR / "save" / "flow.waldiez")
                runner.run()
        except Exception as e:
            to_log = f"Error running flow: {e}"
            logger.error(to_log)
            return OutgoingMessage(
                type="runResult", success=False, message=to_log
            )
            # await self._send(
            #     OutgoingMessage(
            #         type="runResult", success=False, message=to_log
            #     ),
            #     websocket,
            # )
            # await websocket.send(
            #     json.dumps(
            #         {
            #             "type": "runResult",
            #             "success": False,
            #             "message": f"Error running flow: {str(e)}",
            #         }
            #     )
            # )
            # return
        # else:
        # to_log = "Flow executed successfully"
        # logger.info(to_log)
        # await self._send(
        #     OutgoingMessage(type="runResult", success=True, message=to_log),
        #     websocket,
        # )
        return OutgoingMessage(
            type="runResult", success=True, message="Flow executed successfully"
        )
        # await websocket.send(
        #     json.dumps(
        #         {
        #             "type": "runResult",
        #             "success": True,
        #             "message": "Flow executed successfully",
        #         }
        #     )
        # )

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
        # await websocket.send(
        #     json.dumps(
        #         {
        #             "type": "saveResult",
        #             "success": True,
        #             "message": "Flow saved successfully",
        #         }
        #     )
        # )

    async def handle_upload(
        self,
        websocket: websockets.ServerConnection,
        files: List[Dict[str, str]],
    ) -> OutgoingMessage:
        """Handle an 'upload' action with base64-encoded files.

        Parameters
        ----------
        websocket : websockets.ServerConnection
            The WebSocket connection to handle.
        files : List[Dict[str, str]]
            List of files to upload, each with a 'name' and 'content' field.

        Returns
        -------
        OutgoingMessage
            The result of the operation.
        """
        to_log = f"Handling upload action for {len(files)} files"
        logger.info(to_log)
        file_paths = []

        for file_data in files:
            filename = file_data.get("name")
            content_b64 = file_data.get("content")

            if not filename or not content_b64:
                continue

            try:
                content = base64.b64decode(content_b64)
                file_path = UPLOAD_DIR / filename

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
        # await websocket.send(
        #     json.dumps(
        #         {
        #             "type": "uploadResult",
        #             "success": True,
        #             "message": "Files uploaded successfully",
        #             "filePaths": file_paths,
        #         }
        #     )
        # )

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
            # await websocket.send(
            #     json.dumps(
            #         {
            #             "type": "convertResult",
            #             "success": False,
            #             "message": f"Error converting flow: {str(e)}",
            #         }
            #     )
            # )
        #     return
        # await websocket.send(
        #     json.dumps(
        #         {
        #             "type": "convertResult",
        #             "success": True,
        #             "message": output_path,
        #         }
        #     )
        # )
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


if __name__ == "__main__":
    DEV_PORT = 7654
    if "--port" in sys.argv:
        try:
            port_index = sys.argv.index("--port") + 1
            DEV_PORT = int(sys.argv[port_index])
        except (ValueError, IndexError):
            logger.error("Invalid port number provided.")
            sys.exit(1)
    server = WaldiezDevServer(port=DEV_PORT)
    asyncio.run(server.serve())
