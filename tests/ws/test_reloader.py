# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=missing-param-doc,missing-return-doc
# pylint: disable=no-self-use,protected-access,unused-argument
# pyright: reportPrivateUsage=false,reportPossiblyUnboundVariable=false
# pyright: reportConstantRedefinition=false,reportUnknownMemberType=false
"""Tests for auto-reload functionality."""

import os
import shutil
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# pylint: disable=invalid-name
SKIP_TEST = False
try:
    # noinspection PyUnusedImports
    from waldiez.ws.reloader import (
        FileWatcher,
        ReloadHandler,
        create_file_watcher,
    )
except ImportError:
    SKIP_TEST = True


@pytest.mark.skipif(SKIP_TEST, reason="Watchdog not available")
class TestReloadHandler:
    """Test ReloadHandler functionality."""

    def test_reload_handler_init_defaults(self) -> None:
        """Test ReloadHandler initialization with defaults."""
        handler = ReloadHandler()

        assert handler.patterns == {".py", ".json", ".yaml", ".yml"}
        assert handler.ignore_patterns == {
            ".pyc",
            ".pyo",
            ".pyd",
            "__pycache__",
            ".git",
            ".pytest_cache",
            ".mypy_cache",
            ".ruff_cache",
        }
        assert handler.debounce_delay == 0.5
        assert handler.restart_callback is not None
        assert handler.debounce_timer is None
        assert handler.last_restart_time == 0.0
        assert handler.min_restart_interval == 2.0

    def test_reload_handler_init_custom(self) -> None:
        """Test ReloadHandler initialization with custom parameters."""
        patterns = {".py", ".js"}
        ignore_patterns = {".log", ".tmp"}
        debounce_delay = 1.0
        restart_callback = MagicMock()

        handler = ReloadHandler(
            patterns=patterns,
            ignore_patterns=ignore_patterns,
            debounce_delay=debounce_delay,
            restart_callback=restart_callback,
        )

        assert handler.patterns == patterns
        assert handler.ignore_patterns == ignore_patterns
        assert handler.debounce_delay == debounce_delay
        assert handler.restart_callback is restart_callback

    def test_should_watch_file_python_files(self) -> None:
        """Test should_watch_file for Python files."""
        handler = ReloadHandler()

        assert handler.should_watch_file("/path/to/file.py") is True
        assert handler.should_watch_file("/path/to/file.json") is True
        assert handler.should_watch_file("/path/to/file.yaml") is True
        assert handler.should_watch_file("/path/to/file.yml") is True

    def test_should_watch_file_ignored_files(self) -> None:
        """Test should_watch_file for ignored files."""
        handler = ReloadHandler()

        assert handler.should_watch_file("/path/to/file.pyc") is False
        assert handler.should_watch_file("/path/__pycache__/file.py") is False
        assert handler.should_watch_file("/path/.git/config") is False
        assert handler.should_watch_file("/path/.pytest_cache/file") is False

    def test_should_watch_file_wrong_extension(self) -> None:
        """Test should_watch_file for files with wrong extensions."""
        handler = ReloadHandler()

        assert handler.should_watch_file("/path/to/file.txt") is False
        assert handler.should_watch_file("/path/to/file.log") is False
        assert (
            handler.should_watch_file("/path/to/file") is False
        )  # No extension

    def test_should_watch_file_custom_patterns(self) -> None:
        """Test should_watch_file with custom patterns."""
        handler = ReloadHandler(
            patterns={".js", ".ts"}, ignore_patterns={".min.js"}
        )

        assert handler.should_watch_file("/path/to/file.js") is True
        assert handler.should_watch_file("/path/to/file.ts") is True
        assert handler.should_watch_file("/path/to/file.py") is False
        assert handler.should_watch_file("/path/to/file.min.js") is False

    def test_get_src_path_string(self) -> None:
        """Test get_src_path with string path."""
        event = MagicMock()
        event.src_path = "/path/to/file.py"

        result = ReloadHandler.get_src_path(event)
        assert result == "/path/to/file.py"

    def test_get_src_path_path_object(self) -> None:
        """Test get_src_path with Path object."""
        event = MagicMock()
        event.src_path = Path("path/to/file.py")

        result = ReloadHandler.get_src_path(event)
        assert result == os.path.join("path", "to", "file.py")

    def test_on_modified_file(self) -> None:
        """Test on_modified for file events."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.1, restart_callback=restart_callback
        )

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/file.py"

        handler.on_modified(event)

        # Wait for debounce delay
        time.sleep(0.5)

        restart_callback.assert_called_once()

    def test_on_modified_ignored_file(self) -> None:
        """Test on_modified for ignored files."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.1, restart_callback=restart_callback
        )

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/file.pyc"  # Ignored extension

        handler.on_modified(event)

        time.sleep(0.5)

        restart_callback.assert_not_called()

    def test_on_created_file(self) -> None:
        """Test on_created for file events."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.1, restart_callback=restart_callback
        )

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/new_file.py"

        handler.on_created(event)

        time.sleep(0.5)

        restart_callback.assert_called_once()

    def test_on_deleted_file(self) -> None:
        """Test on_deleted for file events."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.1, restart_callback=restart_callback
        )

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/deleted_file.py"

        handler.on_deleted(event)

        time.sleep(0.5)

        restart_callback.assert_called_once()

    def test_debounce_multiple_events(self) -> None:
        """Test that multiple rapid events are debounced."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.2, restart_callback=restart_callback
        )

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/file.py"

        # Trigger multiple events rapidly
        handler.on_modified(event)
        time.sleep(0.05)
        handler.on_modified(event)
        time.sleep(0.05)
        handler.on_modified(event)

        # Wait for debounce delay
        time.sleep(0.5)

        # Should only restart once
        restart_callback.assert_called_once()

    def test_restart_throttling(self) -> None:
        """Test that restarts are throttled."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.1,
            restart_callback=restart_callback,
        )

        # Set recent restart time
        handler.last_restart_time = time.time()

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/file.py"

        handler.on_modified(event)

        time.sleep(0.5)

        # Should not restart due to throttling
        restart_callback.assert_not_called()

    def test_timer_cancellation(self) -> None:
        """Test that previous timer is cancelled when new event occurs."""
        restart_callback = MagicMock()
        handler = ReloadHandler(
            debounce_delay=0.3, restart_callback=restart_callback
        )

        event = MagicMock()
        event.is_directory = False
        event.src_path = "/path/to/file.py"

        # First event
        handler.on_modified(event)
        first_timer = handler.debounce_timer

        # Second event before first timer fires
        time.sleep(0.1)
        handler.on_modified(event)
        second_timer = handler.debounce_timer

        # First timer should be different from second
        assert first_timer is not second_timer

        time.sleep(0.5)

        # Should only restart once
        restart_callback.assert_called_once()

    @patch("waldiez.ws.reloader.sys.executable", "/usr/bin/python")
    @patch("waldiez.ws.reloader.sys.argv", ["script.py", "--arg", "value"])
    @patch("os.execv")
    @patch("os.chdir")
    @patch("time.sleep")
    def test_default_restart(
        self,
        mock_sleep: MagicMock,
        mock_chdir: MagicMock,
        mock_execv: MagicMock,
    ) -> None:
        """Test default restart implementation."""
        ReloadHandler._default_restart()

        mock_chdir.assert_called_once()
        mock_sleep.assert_called_once_with(0.1)
        mock_execv.assert_called_once_with(
            "/usr/bin/python",
            ["/usr/bin/python", "script.py", "--arg", "value"],
        )

    # noinspection PyUnusedLocal
    @patch("os.execv", side_effect=Exception("Restart failed"))
    @patch("os._exit")
    def test_default_restart_failure(
        self, mock_exit: MagicMock, mock_execv: MagicMock
    ) -> None:
        """Test default restart failure handling."""
        ReloadHandler._default_restart()

        mock_exit.assert_called_once_with(1)

    def test_trigger_restart_exception_handling(self) -> None:
        """Test exception handling in _trigger_restart."""
        restart_callback = MagicMock(side_effect=Exception("Restart error"))
        handler = ReloadHandler(restart_callback=restart_callback)

        # Should not raise exception
        handler._trigger_restart()

        restart_callback.assert_called_once()


@pytest.mark.skipif(SKIP_TEST, reason="Watchdog not available")
class TestFileWatcher:
    """Test FileWatcher functionality."""

    def test_file_watcher_init(self) -> None:
        """Test FileWatcher initialization."""
        watch_dirs = [Path("/path/one"), Path("/path/two")]
        patterns = {".py", ".js"}

        watcher = FileWatcher(
            watch_dirs=watch_dirs, patterns=patterns, debounce_delay=1.0
        )

        assert watcher.watch_dirs == watch_dirs
        assert watcher.handler.patterns == patterns
        assert watcher.handler.debounce_delay == 1.0
        assert watcher._is_watching is False

    def test_file_watcher_start_stop(self, tmp_path: Path) -> None:
        """Test FileWatcher start and stop."""
        watch_dirs = [tmp_path / "test_file_watcher_start_stop"]
        watcher = FileWatcher(watch_dirs)

        # Start watching
        watcher.start()
        assert watcher._is_watching is True

        # Stop watching
        watcher.stop()
        assert watcher._is_watching is False

    def test_file_watcher_start_already_watching(self, tmp_path: Path) -> None:
        """Test starting FileWatcher when already watching."""
        watch_dirs = [tmp_path / "test_file_watcher_start_already_watching"]
        watcher = FileWatcher(watch_dirs)

        # Start watching
        watcher.start()
        assert watcher._is_watching is True

        # Start again - should do nothing
        watcher.start()
        assert watcher._is_watching is True

        watcher.stop()

    def test_file_watcher_stop_not_watching(self) -> None:
        """Test stopping FileWatcher when not watching."""
        watch_dirs = [Path("/nonexistent")]
        watcher = FileWatcher(watch_dirs)

        # Should not raise exception
        watcher.stop()
        assert watcher._is_watching is False

    def test_file_watcher_nonexistent_directory(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test FileWatcher with nonexistent directory."""
        watch_dirs = [Path("/nonexistent/path")]
        watcher = FileWatcher(watch_dirs)

        watcher.start()

        # Should log warning about nonexistent directory
        assert "does not exist" in caplog.text

        watcher.stop()

    def test_file_watcher_mixed_directories(self, tmp_path: Path) -> None:
        """Test FileWatcher with mix of existing and nonexistent directories."""
        watch_dirs = [
            tmp_path / "test_file_watcher_mixed_directories",
            Path("/nonexistent/path"),
        ]
        watcher = FileWatcher(watch_dirs)

        watcher.start()
        assert watcher._is_watching is True

        watcher.stop()

    def test_file_watcher_context_manager(self, tmp_path: Path) -> None:
        """Test FileWatcher as context manager."""
        watch_dirs = [tmp_path / "test_file_watcher_context_manager"]

        with FileWatcher(watch_dirs) as watcher:
            assert watcher._is_watching is True

        assert watcher._is_watching is False

    def test_file_watcher_context_manager_exception(
        self, tmp_path: Path
    ) -> None:
        """Test FileWatcher context manager with exception."""
        watcher: FileWatcher | None = None
        watch_dirs = [tmp_path / "test_file_watcher_context_manager_exception"]
        try:
            with FileWatcher(watch_dirs) as watcher:
                assert watcher._is_watching is True
                raise ValueError("Test exception")
        except ValueError:
            pass
        assert watcher
        assert watcher._is_watching is False

    def test_file_watcher_real_file_changes(self, tmp_path: Path) -> None:
        """Test FileWatcher with real file changes."""
        restart_callback = MagicMock()
        watch_dir = tmp_path / "test_file_watcher_real_file_changes"
        watch_dir.mkdir(exist_ok=True)
        watcher = FileWatcher(
            watch_dirs=[watch_dir],
            debounce_delay=0.1,
            restart_callback=restart_callback,
        )

        with watcher:
            # Create a Python file
            test_file = (
                tmp_path / "test_file_watcher_real_file_changes" / "test.py"
            )
            test_file.write_text("print('hello')")

            # Wait for file system event to be processed
            time.sleep(0.3)

            # Should have triggered restart
            restart_callback.assert_called()

    def test_file_watcher_ignored_file_changes(self, tmp_path: Path) -> None:
        """Test FileWatcher ignores changes to ignored files."""
        restart_callback = MagicMock()

        watch_dir = tmp_path / "test_file_watcher_ignored_file_changes"
        watch_dir.mkdir(exist_ok=True)
        watcher = FileWatcher(
            watch_dirs=[watch_dir],
            debounce_delay=0.1,
            restart_callback=restart_callback,
        )

        with watcher:
            # Create a file that should be ignored
            test_file = (
                tmp_path / "test_file_watcher_ignored_file_changes" / "test.pyc"
            )
            test_file.write_text("compiled")

            # Wait a bit
            time.sleep(0.3)

            # Should not have triggered restart
            restart_callback.assert_not_called()


@pytest.mark.skipif(SKIP_TEST, reason="Watchdog not available")
class TestCreateFileWatcher:
    """Test create_file_watcher function."""

    def test_create_file_watcher_basic(self, tmp_path: Path) -> None:
        """Test create_file_watcher with basic parameters."""
        root_dir = tmp_path
        waldiez_dir = root_dir / "waldiez"
        waldiez_dir.mkdir()

        watcher = create_file_watcher(root_dir)

        assert isinstance(watcher, FileWatcher)
        assert waldiez_dir in watcher.watch_dirs

    def test_create_file_watcher_with_additional_dirs(
        self, tmp_path: Path
    ) -> None:
        """Test create_file_watcher with additional directories."""
        root_dir = tmp_path
        waldiez_dir = root_dir / "waldiez"
        waldiez_dir.mkdir()

        additional_dir = root_dir / "additional"
        additional_dir.mkdir()

        watcher = create_file_watcher(
            root_dir, additional_dirs=[additional_dir]
        )

        assert waldiez_dir in watcher.watch_dirs
        assert additional_dir in watcher.watch_dirs

    def test_create_file_watcher_nonexistent_waldiez_dir(
        self, tmp_path: Path
    ) -> None:
        """Test create_file_watcher when waldiez directory doesn't exist."""
        root_dir = tmp_path
        if (root_dir / "waldiez").exists():
            shutil.rmtree(root_dir / "waldiez")

        watcher = create_file_watcher(root_dir)

        # Should not include waldiez directory since it doesn't exist
        waldiez_dir = root_dir / "waldiez"
        assert waldiez_dir not in watcher.watch_dirs

    def test_create_file_watcher_with_kwargs(self, tmp_path: Path) -> None:
        """Test create_file_watcher with additional kwargs."""
        root_dir = tmp_path
        waldiez_dir = root_dir / "waldiez"
        waldiez_dir.mkdir()

        custom_patterns = {".js", ".ts"}
        restart_callback = MagicMock()

        watcher = create_file_watcher(
            root_dir,
            patterns=custom_patterns,
            restart_callback=restart_callback,
        )

        assert watcher.handler.patterns == custom_patterns
        assert watcher.handler.restart_callback is restart_callback

    def test_create_file_watcher_filter_existing_dirs(
        self, tmp_path: Path
    ) -> None:
        """Test that create_file_watcher filters to only existing dirs."""
        root_dir = tmp_path

        # Create only one of the directories
        existing_dir = root_dir / "existing"
        existing_dir.mkdir()

        nonexistent_dir = root_dir / "nonexistent"

        watcher = create_file_watcher(
            root_dir, additional_dirs=[existing_dir, nonexistent_dir]
        )

        assert existing_dir in watcher.watch_dirs
        assert nonexistent_dir not in watcher.watch_dirs
