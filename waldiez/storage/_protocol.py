# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pyright: reportReturnType=false
"""Protocol for storage operations in Waldiez."""

from pathlib import Path
from typing import Any, Optional, Protocol, Union, runtime_checkable


@runtime_checkable
class WaldiezStorage(Protocol):
    """Protocol for storage operations."""

    def get_root_dir(self) -> Path:
        """Get the root directory for storage.

        Returns
        -------
        Path
            The root directory path.
        """

    def get_uploads_dir(self) -> Path:
        """Get the uploads directory for storage.

        Returns
        -------
        Path
            The uploads directory path.
        """

    def get_docs_dir(self) -> Path:
        """Get the documents directory for storage.

        Returns
        -------
        Path
            The documents directory path.
        """

    def get_parsed_docs_dir(self) -> Path:
        """Get the parsed documents directory for storage.

        Returns
        -------
        Path
            The parsed documents directory path.
        """

    def get_embeddings_dir(self) -> Path:
        """Get the embeddings directory for storage.

        Returns
        -------
        Path
            The embeddings directory path.
        """

    def get_chroma_db_dir(self) -> Path:
        """Get the Chroma database directory for storage.

        Returns
        -------
        Path
            The Chroma database directory path.
        """

    def save_file(
        self,
        file: Union[str, Path, bytes],
        target_dir: str,
        filename: Optional[str] = None,
    ) -> Path:
        """Save a file to the specified directory.

        Parameters
        ----------
        file : Union[str, Path, bytes]
            The file to save.
        target_dir : str
            The target directory where the file will be saved.
        filename : Optional[str], optional
            The name of the file to save, by default None.

        Returns
        -------
        Path
            The path where the file was saved.
        """

    def list_files(self, target_dir: str) -> list[Path]:
        """List files in the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to list files from.

        Returns
        -------
        list[Path]
            A list of file paths in the specified directory.
        """

    def delete_file(self, target_dir: str, filename: str) -> bool:
        """Delete a file from the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to delete the file from.
        filename : str
            The name of the file to delete.

        Returns
        -------
        bool
            True if the file was deleted successfully, False otherwise.
        """

    def read_file(self, target_dir: str, filename: str) -> bytes:
        """Read a file from the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to read the file from.
        filename : str
            The name of the file to read.

        Returns
        -------
        bytes
            The contents of the file.
        """

    def file_exists(self, target_dir: str, filename: str) -> bool:
        """Check if a file exists in the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to check for the file.
        filename : str
            The name of the file to check.

        Returns
        -------
        bool
            True if the file exists, False otherwise.
        """

    def get_file_path(self, target_dir: str, filename: str) -> Path | None:
        """Get the full path of a file in the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory where the file is located.
        filename : str
            The name of the file.

        Returns
        -------
        Path | None
            The full path of the file if it exists, None otherwise.
        """

    def save_json(
        self,
        data: dict[str, Any],
        target_dir: str,
        filename: str,
        indent: int = 2,
    ) -> Path:
        """Save a dictionary as a JSON file in the specified directory.

        Parameters
        ----------
        data : dict
            The dictionary to save as JSON.
        target_dir : str
            The directory where the JSON file will be saved.
        filename : str
            The name of the JSON file.
        indent : int, optional
            The indentation level for the JSON file, by default 2.

        Returns
        -------
        Path
            The path where the JSON file was saved.
        """

    async def a_save_json(
        self,
        data: dict[str, Any],
        target_dir: str,
        filename: str,
        indent: int = 2,
    ) -> Path:
        """Asynchronously save a dictionary as a JSON file.

        Parameters
        ----------
        data : dict[str, Any]
            The dictionary to save as JSON.
        target_dir : str
            The directory where the JSON file will be saved.
        filename : str
            The name of the JSON file.
        indent : int, optional
            The indentation level for the JSON file, by default 2.

        Returns
        -------
        Path
            The path where the JSON file was saved.
        """

    def read_json(self, target_dir: str, filename: str) -> dict[str, Any]:
        """Read a JSON file from the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to read the JSON file from.
        filename : str
            The name of the JSON file to read.

        Returns
        -------
        dict[str, Any]
            The contents of the JSON file as a dictionary.
        """

    async def a_read_json(
        self, target_dir: str, filename: str
    ) -> dict[str, Any]:
        """Asynchronously read a JSON file from the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to read the JSON file from.
        filename : str
            The name of the JSON file to read.

        Returns
        -------
        dict[str, Any]
            The contents of the JSON file as a dictionary.
        """

    async def a_read_file(self, target_dir: str, filename: str) -> bytes:
        """Asynchronously read a file from the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to read the file from.
        filename : str
            The name of the file to read.

        Returns
        -------
        bytes
            The contents of the file.
        """

    async def a_write_file(
        self,
        content: bytes,
        target_dir: str,
        filename: str,
    ) -> Path:
        """Asynchronously write content to a file in the specified directory.

        Parameters
        ----------
        content : bytes
            The content to write to the file.
        target_dir : str
            The directory where the file will be written.
        filename : str
            The name of the file to write.

        Returns
        -------
        Path
            The path where the file was written.
        """
