# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Mock websockets for linters."""
# pylint: disable=invalid-name,line-too-long,unused-argument,too-few-public-methods,no-self-use
# pylint: disable=missing-class-docstring,missing-function-docstring,missing-return-doc
# flake8: noqa: E501, D101, D102, D106

from typing import Any  # pragma: no cover


# noinspection PyPep8Naming, PyMethodMayBeStatic,PyUnusedLocal
class websockets:  # pragma: no cover
    # noinspection PyMethodMayBeStatic
    class ClientConnection:
        async def __aenter__(self) -> "websockets.ClientConnection":
            return self

        async def send(self, data: Any) -> None:
            pass

        async def close(self) -> None:
            pass

        async def recv(self) -> str:
            return ""

    # noinspection PyPep8Naming
    class exceptions:
        class ConnectionClosedError(Exception): ...

    class ConnectionClosedOK(Exception): ...

    class Server:
        def close(self) -> None:
            pass

        async def wait_closed(self) -> None:
            pass

    class ServerConnection:
        remote_address: str

        # noinspection PyPep8Naming
        class request:
            headers: dict[str, str]

        async def close(
            self, code: int = 1000, reason: str = "Normal Closure"
        ) -> None:
            pass

        # noinspection PyPep8Naming
        async def ConnectionClosedOK(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def send(self, data: Any) -> None:
            pass

    @staticmethod
    async def serve(*args: Any, **kwargs: Any) -> "websockets.Server":
        return websockets.Server()

    @staticmethod
    async def connect(
        *args: Any, **kwargs: Any
    ) -> "websockets.ClientConnection":
        return websockets.ClientConnection()

    class ConnectionClosed(Exception):
        pass

    class WebSocketException(Exception):
        pass
