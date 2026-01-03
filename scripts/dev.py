# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=consider-using-with,too-many-try-statements
# pyright: reportUnusedParameter=false
"""Development server runner - starts both backend and frontend."""

import signal
import subprocess
import sys
import time
from pathlib import Path
from types import FrameType
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
DOT_LOCAL = ROOT_DIR / ".local"

WORKSPACE_DIR = DOT_LOCAL / "workspace"
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)


def run_dev_servers(py_port: int | None) -> None:
    """Run both Python backend and Vite frontend concurrently.

    Parameters
    ----------
    py_port : int | None
        The port for the Python backend server.
    """
    processes: list[tuple[str, subprocess.Popen[Any]]] = []
    try:
        # Start Python dev server
        python_cmd = [
            sys.executable,
            "-m",
            "waldiez.ws",
            "--workspace",
            str(WORKSPACE_DIR),
            "--auto-reload",
            "--verbose",
        ]
        if py_port:
            python_cmd.extend(["--port", str(py_port)])

        print("Starting Python dev server...")
        python_process = subprocess.Popen(
            python_cmd,
            cwd=ROOT_DIR,
        )
        processes.append(("Python", python_process))

        # Start Vite dev server
        print("Starting Vite dev server...")
        vite_cmd = ["bun", "run", "dev"]

        vite_process = subprocess.Popen(
            vite_cmd,
            cwd=Path.cwd(),
        )
        processes.append(("Vite", vite_process))

        print("Both servers started! Press Ctrl+C to stop.")

        # Wait for processes
        while True:
            for name, process in processes:
                if process.poll() is not None:
                    print(f" {name} server stopped unexpectedly")
                    return

            # Check every second
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n Shutting down servers...")

    finally:
        # Clean shutdown
        for name, process in processes:
            if process.poll() is None:
                print(f"   Stopping {name} server...")
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    print(f"   Force killing {name} server...")
                    process.kill()


# pylint: disable=unused-argument
# noinspection PyUnusedLocal
def signal_handler(signum: int, frame: FrameType | None) -> None:
    """Handle Ctrl+C gracefully.

    Parameters
    ----------
    signum : int
        The signal number.
    frame : FrameType | None
        The current stack frame.
    """
    print("\n Received interrupt signal...")
    sys.exit(0)


def main() -> None:
    """Start the development servers."""
    # Set up signal handling
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    py_port: int | None = None
    # Add any additional args passed to this script
    if len(sys.argv) > 1:
        # Filter out frontend-specific args or add backend-specific ones
        for arg in sys.argv[1:]:
            if arg.startswith("--port"):
                py_port = (
                    int(arg.split("=")[1])
                    if "=" in arg
                    else int(sys.argv[sys.argv.index(arg) + 1])
                )
    run_dev_servers(py_port)


if __name__ == "__main__":
    main()
