"""Start a local PyPI server for testing packages."""

import os
import signal
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path
from types import FrameType

try:
    from dotenv import load_dotenv
except ImportError:
    pass
else:
    dot_env_path = Path(__file__).resolve().parent.parent / ".env"
    if dot_env_path.exists():
        load_dotenv(dot_env_path)

# pylint: disable=broad-except,too-many-try-statements,line-too-long,consider-using-with,unused-argument  # noqa: E501
os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONUNBUFFERED"] = "1"
ROOT_DIR = Path(__file__).resolve().parent.parent


def ensure_pypiserver_installed(py_executable: str) -> None:
    """Ensure that the pypiserver package is installed.

    Parameters
    ----------
    py_executable : str
        Path to the Python executable.
    """
    try:
        subprocess.run(  # nosemgrep # nosec
            [py_executable, "-m", "pip", "install", "pypiserver"], check=True
        )
    except subprocess.CalledProcessError:
        print("Failed to install pypiserver.", file=sys.stderr)
        sys.exit(1)


def start_pypi_server(py_executable: str) -> None:
    """Start the PyPI server in the foreground with signal handling.

    Parameters
    ----------
    py_executable : str
        Path to the Python executable
    """
    root_dir = Path(__file__).resolve().parent.parent
    local_pypi_dir = root_dir / ".local" / "pypi"
    local_pypi_dir.mkdir(parents=True, exist_ok=True)

    port = os.getenv("PYPI_SERVER_PORT", "8080")
    print(f"Starting PyPI server on port {port}...")

    def cleanup_and_exit(signum: int, frame: FrameType) -> None:
        """Cleanup logic for signal termination.

        Parameters
        ----------
        signum : int
            Signal number
        frame : signal.FrameType
            Signal frame
        """
        print("\nReceived termination signal. Stopping PyPI server...")
        sys.exit(0)

    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, cleanup_and_exit)
    signal.signal(signal.SIGINT, cleanup_and_exit)

    try:
        subprocess.run(
            [
                py_executable,
                "-m",
                "pypiserver",
                "run",
                "-p",
                port,
                "-a",
                ".",
                "-P",
                ".",
                str(local_pypi_dir),
            ],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"Error starting PyPI server: {e}", file=sys.stderr)
        sys.exit(1)


def _stop_using_tasklist() -> None:
    cmd = [
        "powershell",
        "-Command",
        "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'pypi-server' } | Select-Object -ExpandProperty ProcessId",  # noqa: E501
    ]
    try:
        result = subprocess.run(  # nosemgrep # nosec
            cmd,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if result.stdout.strip():
            pid_entries = result.stdout.decode("utf-8").strip().split("\n")
            for pid_entry in pid_entries:
                try:
                    subprocess.run(  # nosemgrep # nosec
                        ["taskkill", "/F", "/PID", pid_entry], check=True
                    )
                except BaseException:
                    pass
            print("Stopped PyPI server.")
    except BaseException:
        pass


def _stop_using_ps() -> None:
    """Stop the PyPI server using the `ps` command."""
    cmd = "ps aux | grep -v grep | grep pypiserver | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1 || true"  # noqa: E501
    try:
        subprocess.run(cmd, shell=True, check=True)  # nosemgrep # nosec
    except BaseException:
        pass


def stop_pypi_server() -> None:
    """Stop the PyPI server if it is running."""
    if sys.platform == "win32":
        _stop_using_tasklist()
        return
    _stop_using_ps()


def main() -> None:
    """Start a local PyPI server."""
    if "stop" in sys.argv:
        stop_pypi_server()
        return
    venv_path = ROOT_DIR / ".venv"
    py_executable = (
        venv_path / "Scripts" / "python.exe"
        if os.name == "nt"
        else venv_path / "bin" / "python"
    )
    if not py_executable.exists():
        py_executable = sys.executable
    ensure_pypiserver_installed(py_executable)
    start_pypi_server(py_executable)


if __name__ == "__main__":
    main()
