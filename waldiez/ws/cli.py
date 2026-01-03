# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=too-many-locals,unused-import,invalid-name
# pylint: disable=missing-function-docstring, missing-param-doc
# pyright: reportUnusedImport=false,reportConstantRedefinition=false
# pyright: reportUnusedParameter=false, reportCallInDefaultInitializer=false

"""CLI interface for Waldiez WebSocket server."""

import asyncio
import logging
import os
import re
import sys
import traceback
from pathlib import Path
from typing import Annotated, Any

import typer

HAS_WATCHDOG = False
try:
    from .reloader import FileWatcher  # noqa: F401

    HAS_WATCHDOG = True
except ImportError:
    pass

HAS_WEBSOCKETS = False
try:
    from .server import run_server

    HAS_WEBSOCKETS = True
except ImportError:
    # pylint: disable=missing-param-doc,missing-raises-doc
    # noinspection PyUnusedLocal
    async def run_server(*args: Any, **kwargs: Any) -> None:  # type: ignore
        """No WebSocket server available."""
        raise NotImplementedError("WebSocket server is not available.")


DEFAULT_WORKSPACE_DIR = Path.cwd()
DEFAULT_WS_PORT = 8765


def setup_logging(verbose: bool = False) -> None:
    """Set up logging configuration.

    Parameters
    ----------
    verbose : bool
        Enable verbose logging
    """
    level = logging.DEBUG if verbose else logging.INFO
    format_str = (
        "%(asctime)s - %(name)s - %(filename)s:%(lineno)d"
        " -%(levelname)s - %(message)s"
    )

    logging.basicConfig(
        level=level,
        format=format_str,
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Set websockets logger to WARNING to reduce noise
    logging.getLogger("websockets").setLevel(logging.WARNING)


app = typer.Typer(
    name="waldiez-ws",
    help="Waldiez WebSocket server",
    add_completion=False,
    context_settings={
        "help_option_names": ["-h", "--help"],
        "allow_extra_args": True,
        "ignore_unknown_options": True,
    },
)


# noinspection PyBroadException
def _get_ws_port() -> int:
    """Get the default ws server port to use."""
    vite_ws_config = os.environ.get("VITE_DEV_WS_URL", "")
    if not vite_ws_config:
        return DEFAULT_WS_PORT
    # VITE_DEV_WS_URL=ws://localhost:8765
    server_parts = vite_ws_config.rsplit(":", maxsplit=1)
    if not server_parts:
        return DEFAULT_WS_PORT
    try:
        return int(server_parts[-1])
    except Exception:  # pylint: disable=broad-exception-caught
        return DEFAULT_WS_PORT


# noinspection PyBroadException
@app.command()
def serve(
    host: Annotated[
        str, typer.Option(help="Server host address")
    ] = "localhost",
    port: Annotated[int, typer.Option(help="Server port")] = _get_ws_port(),
    max_clients: Annotated[
        int,
        typer.Option(
            "--max-clients", help="Maximum number of concurrent clients"
        ),
    ] = 1,
    allowed_origins: Annotated[
        list[str] | None,
        typer.Option(
            "--allowed-origin",
            help=(
                "Allowed origins for CORS (can be used multiple times). "
                "Supports regex patterns. "
                "Examples: 'https://example.com', '.*\\.mydomain\\.com'"
            ),
        ),
    ] = None,
    auto_reload: Annotated[
        bool,
        typer.Option(
            "--auto-reload",
            help=(
                "Enable auto-reload on file changes "
                "(requires: pip install watchdog)"
            ),
        ),
    ] = False,
    watch_dir: Annotated[
        list[Path] | None,
        typer.Option(
            "--watch-dir",
            help=(
                "Additional directories to watch for auto-reload "
                "(can be used multiple times)"
            ),
        ),
    ] = None,
    workspace_dir: Annotated[
        Path,
        typer.Option(
            "--workspace",
            help="Path to the workspace directory",
            resolve_path=True,
            dir_okay=True,
            file_okay=False,
        ),
    ] = DEFAULT_WORKSPACE_DIR,
    ping_interval: Annotated[
        float,
        typer.Option(
            "--ping-interval", help="WebSocket ping interval in seconds"
        ),
    ] = 20.0,
    ping_timeout: Annotated[
        float,
        typer.Option(
            "--ping-timeout", help="WebSocket ping timeout in seconds"
        ),
    ] = 20.0,
    max_size: Annotated[
        int, typer.Option("--max-size", help="Maximum message size in bytes")
    ] = 8388608,
    verbose: Annotated[
        bool, typer.Option("--verbose", "-v", help="Enable verbose logging")
    ] = False,
) -> None:
    """Start Waldiez WebSocket server."""
    setup_logging(verbose)

    logger = logging.getLogger(__name__)

    # Convert watch directories to set
    watch_dirs: set[Path] | None = None
    if watch_dir:
        watch_dirs = set(watch_dir)

    compiled_origins: list[re.Pattern[str]] | None = None
    if allowed_origins:
        try:
            compiled_origins = [
                re.compile(pattern) for pattern in allowed_origins
            ]
        except re.error as e:
            typer.echo(f"Invalid regex pattern in allowed origins: {e}")
            sys.exit(1)

    # Server configuration
    server_config: dict[str, Any] = {
        "max_clients": max_clients,
        "allowed_origins": compiled_origins,
        "ping_interval": ping_interval,
        "ping_timeout": ping_timeout,
        "max_size": max_size,
    }
    if not HAS_WATCHDOG and auto_reload:
        msg = (
            "Auto-reload requires the 'watchdog' package. "
            "Please install it with: pip install watchdog"
        )
        typer.echo(msg)
        auto_reload = False
    logger.info("Starting Waldiez WebSocket server...")
    logger.info("Configuration:")
    logger.info("  Host: %s", host)
    logger.info("  Port: %d", port)
    logger.info("  Max clients: %d", max_clients)
    logger.info("  Allowed origins: %s", allowed_origins or ["*"])
    logger.info("  Auto-reload: %s", auto_reload)
    logger.info("  Workspace directory: %s", workspace_dir)

    if watch_dirs:
        logger.info("  Watch directories: %s", watch_dirs)

    try:
        asyncio.run(
            run_server(
                host=host,
                port=port,
                workspace_dir=workspace_dir,
                auto_reload=auto_reload,
                watch_dirs=watch_dirs,
                **server_config,
            )
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception:  # pylint: disable=broad-exception-caught
        tb = traceback.format_exc()
        logger.error("Server error: %s", tb)
        sys.exit(1)


if __name__ == "__main__":
    app()
