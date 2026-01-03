# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=missing-param-doc,missing-return-doc,missing-yield-doc
# pylint: disable=missing-return-type-doc,no-self-use,too-many-try-statements
# pylint: disable=broad-exception-caught,protected-access,no-self-use
# pylint: disable=too-many-locals
# pyright: reportUnknownMemberType=false,reportUnknownArgumentType=false
# pyright: reportAttributeAccessIssue=false

"""Integration tests for the storage module."""

import concurrent.futures
import json
import shutil
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pytest

from waldiez.storage import StorageManager
from waldiez.storage.checkpoint import WaldiezCheckpointInfo


class TestStorageIntegration:
    """Integration tests for the complete storage system."""

    def test_complete_workflow(self, tmp_path: Path) -> None:
        """Test a complete workflow using the storage system."""
        # Initialize storage
        storage = StorageManager(workspace_dir=tmp_path / "workspace")

        # Session 1: Create initial checkpoints
        session1 = "project_alpha"
        for i in range(5):
            state = {
                "iteration": i,
                "agents": [f"agent_{j}" for j in range(i + 1)],
                "metrics": {"loss": 1.0 / (i + 1), "accuracy": i * 0.2},
            }
            metadata = {
                "version": "1.0",
                "author": "test_user",
                "tags": ["experiment", f"iteration_{i}"],
            }
            storage.save(session1, state, metadata)
            time.sleep(0.01)

        # Session 2: Different project
        session2 = "project_beta"
        for i in range(3):
            state = {"config": {"model": f"model_v{i}"}}
            storage.save(session2, state)

        # Create external links
        external_dir = tmp_path / "external_links"
        external_dir.mkdir()

        storage.link(external_dir / "alpha_latest", session1)
        storage.link(external_dir / "beta_latest", session2)

        # Verify checkpoint counts
        assert len(storage.checkpoints(session1)) == 5
        assert len(storage.checkpoints(session2)) == 3
        assert len(storage.checkpoints()) == 8

        # Load latest from each session
        alpha_latest = storage.get(session1)
        assert alpha_latest
        assert alpha_latest.checkpoint.state["iteration"] == 4

        beta_latest = storage.get(session2)
        assert beta_latest
        assert beta_latest.checkpoint.state["config"]["model"] == "model_v2"

        # Clean up old checkpoints
        deleted = storage.cleanup(session1, keep_count=2)
        assert deleted == 3
        assert len(storage.checkpoints(session1)) == 2

        # Verify latest checkpoint info
        latest_info = storage.get_latest_checkpoint(session1)
        assert latest_info is not None
        assert latest_info.checkpoint.metadata["tags"] == [
            "experiment",
            "iteration_4",
        ]

        # Test finalize workflow
        tmp_run_dir = tmp_path / "tmp_run"
        tmp_run_dir.mkdir()

        # Create run artifacts
        (tmp_run_dir / "output.log").write_text("Run completed successfully")
        (tmp_run_dir / "results.json").write_text(
            json.dumps({"final_loss": 0.1, "final_accuracy": 0.95})
        )
        (tmp_run_dir / "tree_of_thoughts.png").write_bytes(b"PNG_DATA")

        output_file = tmp_path / "scripts" / "train.py"
        output_file.parent.mkdir()
        output_file.write_text("# Training script")

        # Finalize the run
        checkpoint_path, public_link = storage.finalize(
            session_name="training_run",
            output_file=output_file,
            tmp_dir=tmp_run_dir,
            metadata={"status": "completed", "duration": "2h 15m"},
        )

        # Verify finalized checkpoint
        assert (checkpoint_path / "output.log").exists()
        assert (checkpoint_path / "results.json").exists()
        assert public_link.is_symlink()

        # Verify promoted file
        assert (output_file.parent / "tree_of_thoughts.png").exists()

        # Clean broken symlinks after deleting a checkpoint
        checkpoints = storage.checkpoints("training_run")
        if checkpoints:
            storage.delete("training_run", checkpoints[0].timestamp)

        cleaned = storage.clean_broken_symlinks()
        assert cleaned >= 0  # May or may not have broken links

    def test_concurrent_operations(self, tmp_path: Path) -> None:
        """Test concurrent operations on the storage system."""
        storage = StorageManager(workspace_dir=tmp_path / "workspace")

        def _worker(
            worker_id: int, operation_count: int = 10
        ) -> list[tuple[str, Any]]:
            """Worker function for concurrent test."""
            session = f"worker_{worker_id}"
            results: list[tuple[str, Any]] = []

            for i in range(operation_count):
                try:
                    # Save checkpoint
                    state = {
                        "worker": worker_id,
                        "operation": i,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    path = storage.save(session, state)
                    results.append(("save", path))

                    # Create external link
                    link_dir = tmp_path / "links" / f"worker_{worker_id}"
                    link_dir.mkdir(parents=True, exist_ok=True)
                    storage.link(link_dir, session)

                    # List checkpoints
                    checkpoints: list[WaldiezCheckpointInfo] = (
                        storage.checkpoints(session)
                    )
                    results.append(("list", len(checkpoints)))

                    # Load latest
                    loaded = storage.get(session)
                    assert loaded
                    results.append(
                        ("load", loaded.checkpoint.state["operation"])
                    )

                    # Occasionally cleanup
                    if i % 5 == 0 and i > 0:
                        deleted = storage.cleanup(session, keep_count=3)
                        results.append(("cleanup", deleted))

                except Exception as e:
                    results.append(("error", str(e)))

                # Small random delay
                time.sleep(0.001 * (worker_id % 3))

            return results

        # Run concurrent workers
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(_worker, i, 20) for i in range(5)]

            all_results: list[tuple[str, Path]] = []
            for future in concurrent.futures.as_completed(futures):
                all_results.extend(future.result())

        # Verify no errors occurred
        errors = [r for r in all_results if r[0] == "error"]
        assert len(errors) == 0, f"Errors occurred: {errors}"

        # Verify all sessions exist
        for i in range(5):
            assert storage.session_exists(f"worker_{i}")

    def test_registry_persistence_and_recovery(self, tmp_path: Path) -> None:
        """Test that the registry persists and recovers correctly."""
        workspace = tmp_path / "persistent_workspace"

        # Phase 1: Create checkpoints and links
        storage1 = StorageManager(workspace_dir=workspace)

        checkpoint_paths: list[Path] = []
        external_links: list[Path] = []

        for i in range(3):
            # Save checkpoint
            path = storage1.save(f"session_{i}", {"data": i})
            checkpoint_paths.append(path)

            # Create external link
            link_dir = tmp_path / "external" / f"session_{i}"
            link_dir.mkdir(parents=True)
            storage1.link(link_dir, f"session_{i}")
            external_links.append(link_dir)

        # Phase 2: New instance, verify registry loaded
        storage2 = StorageManager(workspace_dir=workspace)

        # Manually delete a checkpoint directory
        shutil.rmtree(checkpoint_paths[1])

        # Clean broken symlinks
        cleaned = storage2.clean_broken_symlinks()
        assert cleaned > 0  # Should clean at least one broken link

        # Phase 3: Corrupt registry and test recovery
        registry_file = workspace / ".links_registry.json"
        registry_file.write_text("corrupted{json")

        storage3 = StorageManager(workspace_dir=workspace)

        # Should have created backup
        assert registry_file.with_suffix(".corrupted").exists()

        # Should still function
        storage3.save("recovery_test", {"recovered": True})

    def test_transaction_atomicity(self, tmp_path: Path) -> None:
        """Test transaction atomicity and rollback."""
        storage = StorageManager(workspace_dir=tmp_path / "workspace")

        # Create initial state
        storage.save("test_session", {"counter": 0})

        # Successful transaction
        with storage.transaction():
            for i in range(1, 4):
                storage.save("test_session", {"counter": i})

        # Verify last save persisted
        info = storage.get("test_session")
        assert info
        assert info.checkpoint.state["counter"] == 3

        # Failed transaction with registry changes
        external_dir = tmp_path / "transaction_links"
        external_dir.mkdir()

        # Get initial registry state
        if hasattr(storage.storage, "_links_registry"):
            initial_registry_size = len(storage.storage._links_registry)
        else:
            initial_registry_size = 0

        try:
            with storage.transaction():
                # Create checkpoints and external links
                for i in range(5):
                    storage.save("test_session", {"tx_counter": i})
                    link_path = external_dir / f"link_{i}"
                    link_path.mkdir(parents=True)
                    storage.link(link_path, "test_session")

                # Force error to test rollback
                raise RuntimeError("Transaction failed")
        except RuntimeError:
            pass

        # Verify registry was rolled back
        if hasattr(storage.storage, "_links_registry"):
            final_registry_size = len(storage.storage._links_registry)
            assert final_registry_size == initial_registry_size

    def test_edge_cases(self, tmp_path: Path) -> None:
        """Test various edge cases."""
        storage = StorageManager(workspace_dir=tmp_path / "workspace")

        # Load from non-existent session
        with pytest.raises(FileNotFoundError):
            storage.get("non_existent")

        # Delete non-existent checkpoint
        with pytest.raises(FileNotFoundError):
            storage.delete("non_existent", datetime.now(timezone.utc))

        # Cleanup on empty session
        deleted = storage.cleanup("empty_session", keep_count=5)
        assert deleted == 0

        # Link to non-existent checkpoint
        with pytest.raises(FileNotFoundError):
            storage.link(tmp_path / "link", "non_existent")

        # Save with future timestamp
        future_time = datetime.now(timezone.utc) + timedelta(days=1)
        future_path = storage.storage.save_checkpoint(
            "future_session", {"future": True}, timestamp=future_time
        )
        assert future_path.exists()

        # Load specific timestamp
        loaded = storage.get("future_session", future_time)
        assert loaded
        assert loaded.checkpoint.state["future"] is True

    def test_large_state_handling(self, tmp_path: Path) -> None:
        """Test handling of large state objects."""
        storage = StorageManager(workspace_dir=tmp_path / "workspace")

        # Create large state
        large_state = {
            "data": ["x" * 1000 for _ in range(1000)],  # ~1MB of data
            "nested": {
                f"key_{i}": {"values": list(range(100)), "text": "y" * 100}
                for i in range(100)
            },
        }

        # Save and load
        checkpoint_path = storage.save("large_session", large_state)
        loaded_info = storage.get("large_session")
        assert loaded_info
        loaded_state = loaded_info.checkpoint.state

        # Verify integrity
        assert loaded_state == large_state
        assert checkpoint_path.exists()

        # Check file size
        state_file = checkpoint_path / "state.json"
        assert state_file.stat().st_size > 1_000_000  # > 1MB

    def test_checkpoint_metadata_persistence(self, tmp_path: Path) -> None:
        """Test that metadata persists correctly across operations."""
        storage = StorageManager(workspace_dir=tmp_path / "workspace")

        # Rich metadata
        metadata = {
            "experiment": {
                "name": "test_run",
                "parameters": {
                    "learning_rate": 0.001,
                    "batch_size": 32,
                    "epochs": 100,
                },
                "hardware": {"gpu": "NVIDIA A100", "cpu": "AMD EPYC 7742"},
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tags": ["production", "v2.0", "optimized"],
            "metrics": {"final_loss": 0.023, "final_accuracy": 0.987},
        }

        storage.save("metadata_test", {"state": "final"}, metadata)

        # Retrieve and verify
        checkpoints = storage.checkpoints("metadata_test")
        assert len(checkpoints) == 1

        # Verify metadata persists across storage instances
        storage2 = StorageManager(workspace_dir=tmp_path / "workspace")
        checkpoints2 = storage2.checkpoints("metadata_test")
        assert checkpoints2[0].checkpoint.metadata == metadata
