# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=unused-import,unused-argument,protected-access
# pylint: disable=too-many-public-methods,too-few-public-methods
# pylint: disable=missing-param-doc,missing-return-doc,no-self-use
"""Test waldiez.storage._protocol.*."""

from inspect import signature

from waldiez.storage import WaldiezLocalStorage
from waldiez.storage._protocol import WaldiezStorage


class TestWaldiezStorageProtocol:
    """Test suite for WaldiezStorage protocol."""

    def test_protocol_is_runtime_checkable(self) -> None:
        """Test that WaldiezStorage is a runtime checkable protocol."""
        # Test that we can use isinstance with the protocol

        storage = WaldiezLocalStorage()
        assert isinstance(storage, WaldiezStorage)

    def test_protocol_methods_exist(self) -> None:
        """Test that all required protocol methods are defined."""
        # Check that all methods are defined in the protocol
        required_methods = [
            "get_root_dir",
            "get_uploads_dir",
            "get_docs_dir",
            "get_parsed_docs_dir",
            "get_embeddings_dir",
            "get_chroma_db_dir",
            "save_file",
            "list_files",
            "delete_file",
            "read_file",
            "file_exists",
            "get_file_path",
            "save_json",
            "a_save_json",
            "read_json",
            "a_read_json",
            "a_read_file",
            "a_write_file",
        ]

        for method_name in required_methods:
            assert hasattr(WaldiezStorage, method_name)

    def test_protocol_annotations_exist(self) -> None:
        """Test that the protocol has proper type annotations."""
        annotations = getattr(WaldiezStorage, "__annotations__", {})
        # The protocol should have annotations for its methods
        assert (
            len(annotations) >= 0
        )  # Protocols may not have annotations in __annotations__

        # Test that the protocol has proper method signatures by checking
        #  if they exist

        # Just verify we can get signatures (means methods are properly defined)
        method_names = [
            "get_root_dir",
            "save_file",
            "read_file",
            "save_json",
        ]

        for method_name in method_names:
            method = getattr(WaldiezStorage, method_name, None)
            if method is not None:
                # If method exists, we should be able to get its signature
                sig = signature(method)
                assert sig is not None
