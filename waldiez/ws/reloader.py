# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Auto-reload functionality for development."""

import logging
import os
import sys
import threading
import time
from pathlib import Path
from types import TracebackType
from typing import Any, Callable

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

logger = logging.getLogger(__name__)


class ReloadHandler(FileSystemEventHandler):
    """Handler for file system events that triggers server reload."""

    _cwd: str = os.getcwd()

    def __init__(
        self,
        patterns: set[str] | None = None,
        ignore_patterns: set[str] | None = None,
        debounce_delay: float = 0.5,
        restart_callback: Callable[[], None] | None = None,
    ):
        """Initialize the reload handler.

        Parameters
        ----------
        patterns : set[str] | None
            File patterns to watch (e.g., {'.py', '.json'})
        ignore_patterns : set[str] | None
            File patterns to ignore
        debounce_delay : float
            Delay before triggering restart to debounce rapid changes
        restart_callback : Callable[[], None] | None
            Custom restart callback (defaults to os.execv)
        """
        super().__init__()
        if patterns is None:
            patterns = {".py", ".json", ".yaml", ".yml"}
        self.patterns = patterns
        self.ignore_patterns = ignore_patterns or {
            ".pyc",
            ".pyo",
            ".pyd",
            "__pycache__",
            ".git",
            ".pytest_cache",
            ".mypy_cache",
            ".ruff_cache",
        }
        self.debounce_delay = debounce_delay
        self.restart_callback = restart_callback or self._default_restart
        self.debounce_timer: threading.Timer | None = None
        self.last_restart_time = 0.0
        self.min_restart_interval = 2.0  # Minimum seconds between restarts

    def should_watch_file(self, file_path: str) -> bool:
        """Check if a file should trigger a reload.

        Parameters
        ----------
        file_path : str
            Path to the file

        Returns
        -------
        bool
            True if file should be watched
        """
        if not self.patterns:
            return False
        path = Path(file_path)

        # Check file extension
        if not any(path.name.endswith(pattern) for pattern in self.patterns):
            return False

        # Check ignore patterns
        if any(path.name.endswith(ignore) for ignore in self.ignore_patterns):
            return False

        # Also check if ignore patterns are in path parts (for directories)
        if any(ignore in path.parts for ignore in self.ignore_patterns):
            return False

        return True

    @staticmethod
    def get_src_path(event: FileSystemEvent) -> str:
        """Get the source path from the event.

        Parameters
        ----------
        event : FileSystemEvent
            The file system event

        Returns
        -------
        str
            The source path as a string
        """
        return (
            event.src_path
            if isinstance(event.src_path, str)
            else str(event.src_path)
        )

    def on_modified(self, event: FileSystemEvent) -> None:
        """Handle file modification events.

        Parameters
        ----------
        event : FileSystemEvent
            The file system event
        """
        if event.is_directory:
            return
        src_path = self.get_src_path(event)
        if not self.should_watch_file(src_path):
            return
        logger.info("File changed: %s", src_path)
        self._schedule_restart()

    def on_created(self, event: FileSystemEvent) -> None:
        """Handle file creation events.

        Parameters
        ----------
        event : FileSystemEvent
            The file system event
        """
        src_path = self.get_src_path(event)
        if not event.is_directory and self.should_watch_file(src_path):
            logger.info("File created: %s", src_path)
            self._schedule_restart()

    def on_deleted(self, event: FileSystemEvent) -> None:
        """Handle file deletion events.

        Parameters
        ----------
        event : FileSystemEvent
            The file system event
        """
        src_path = self.get_src_path(event)
        if not event.is_directory and self.should_watch_file(
            src_path
        ):  # pragma: no branch
            logger.info("File deleted: %s", src_path)
            self._schedule_restart()

    def _schedule_restart(self) -> None:
        """Schedule a restart with debouncing."""
        current_time = time.time()

        # Prevent too frequent restarts
        if current_time - self.last_restart_time < self.min_restart_interval:
            logger.debug("Restart throttled due to recent restart")
            return

        # Cancel previous timer
        if self.debounce_timer:
            self.debounce_timer.cancel()

        # Schedule new restart
        self.debounce_timer = threading.Timer(
            self.debounce_delay, self._trigger_restart
        )
        self.debounce_timer.start()
        logger.debug("Restart scheduled in %ss", self.debounce_delay)

    def _trigger_restart(self) -> None:
        """Trigger the actual restart."""
        self.last_restart_time = time.time()
        logger.info("Triggering server restart...")
        try:
            self.restart_callback()
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error during restart: %s", e)

    @staticmethod
    def _default_restart() -> None:
        """Restart implementation using os.execv."""
        # Save current working directory
        # pylint: disable=too-many-try-statements,broad-exception-caught
        try:
            # Save current working directory
            os.chdir(ReloadHandler._cwd)

            # Give time for cleanup
            time.sleep(0.1)

            # Restart the process with same arguments
            python_path = sys.executable
            args = [python_path] + sys.argv

            logger.info("Restarting with: %s", " ".join(args))

            # Use os.execv to replace current process
            os.execv(python_path, args)  # nosemgrep # nosec

        except Exception as e:
            logger.error("Failed to restart: %s", e)
            # Force exit if restart fails
            os._exit(1)  # nosec


class FileWatcher:
    """File watcher with auto-reload functionality."""

    def __init__(
        self,
        watch_dirs: list[Path],
        patterns: set[str] | None = None,
        ignore_patterns: set[str] | None = None,
        debounce_delay: float = 0.5,
        restart_callback: Callable[[], None] | None = None,
    ):
        """Initialize the file watcher.

        Parameters
        ----------
        watch_dirs : list[Path]
            Directories to watch for changes
        patterns : set[str] | None
            File patterns to watch
        ignore_patterns : set[str] | None
            File patterns to ignore
        debounce_delay : float
            Debounce delay for restart
        restart_callback : Callable[[], None] | None
            Custom restart callback
        """
        self.watch_dirs = watch_dirs
        self.handler = ReloadHandler(
            patterns=patterns,
            ignore_patterns=ignore_patterns,
            debounce_delay=debounce_delay,
            restart_callback=restart_callback,
        )
        self.observer = Observer()
        self._is_watching = False

    def start(self) -> None:
        """Start watching for file changes."""
        if self._is_watching:
            logger.warning("File watcher is already running")
            return

        for watch_dir in self.watch_dirs:
            if watch_dir.exists():
                self.observer.schedule(
                    self.handler, str(watch_dir), recursive=True
                )
                logger.info("Watching directory: %s", watch_dir)
            else:
                logger.warning("Watch directory does not exist: %s", watch_dir)

        self.observer.start()
        self._is_watching = True
        logger.info("File watcher started")

    def stop(self) -> None:
        """Stop watching for file changes."""
        if not self._is_watching:
            return

        self.observer.stop()
        self.observer.join(timeout=5.0)
        self._is_watching = False
        logger.info("File watcher stopped")

    def __enter__(self) -> "FileWatcher":
        """Context manager entry.

        Returns
        -------
        FileWatcher
            The file watcher instance
        """
        self.start()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        """Context manager exit.

        Parameters
        ----------
        exc_type : type[BaseException] | None
            The type of the exception
        exc_val : BaseException | None
            The exception instance
        exc_tb : TracebackType | None
            The traceback object
        """
        self.stop()


def create_file_watcher(
    root_dir: Path,
    additional_dirs: list[Path] | None = None,
    **kwargs: Any,
) -> FileWatcher:
    """Create a file watcher for typical Waldiez development setup.

    Parameters
    ----------
    root_dir : Path
        Root directory of the project
    additional_dirs : list[Path] | None
        Additional directories to watch
    **kwargs
        Additional arguments for FileWatcher

    Returns
    -------
    FileWatcher
        Configured file watcher
    """
    watch_dirs = [root_dir / "waldiez"]

    if additional_dirs:
        watch_dirs.extend(additional_dirs)

    # Filter to existing directories
    watch_dirs = [d for d in watch_dirs if d.exists()]

    return FileWatcher(watch_dirs, **kwargs)
