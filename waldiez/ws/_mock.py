# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Mock implementation of the websockets module."""
# pylint: disable=invalid-name,line-too-long,unused-argument,too-few-public-methods,no-self-use
# pylint: disable=missing-class-docstring,missing-function-docstring,missing-return-doc
# flake8: noqa: E501, D101, D102, D106

from typing import Any  # pragma: no cover


class websockets:  # pragma: no cover
    class ClientConnection:
        async def send(self, data: Any) -> None:
            pass

        async def close(self) -> None:
            pass

        async def recv(self) -> str:
            return ""

    class ServerConnection:
        remote_address: str

        async def close(
            self, code: int = 1000, reason: str = "Normal Closure"
        ) -> None:
            pass

        async def ConnectionClosedOK(self, *args: Any, **kwargs: Any) -> None:
            pass

    class ConnectionClosed(Exception):
        pass
