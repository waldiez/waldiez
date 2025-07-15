# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Local storage implementation for Waldiez."""

import json
import shutil
from pathlib import Path
from typing import Any, Optional, Union

import aiofiles
from platformdirs import user_data_dir

from ._protocol import WaldiezStorage

APP_NAME = "waldiez"
APP_AUTHOR = "Waldiez"


class WaldiezLocalStorage(WaldiezStorage):
    """Local storage implementation for Waldiez."""

    def __init__(self) -> None:
        """Initialize local storage paths."""
        self._base_dir = Path(user_data_dir(APP_NAME, APP_AUTHOR))
        self._local_root = self._base_dir / "local"
        self._dirs = {
            "uploads": self._local_root / "uploads",
            "docs": self._local_root / "docs",
            "parsed_docs": self._local_root / "parsed_docs",
            "embeddings": self._local_root / "embeddings",
            "chroma": self._local_root / "chroma",
        }
        self._ensure_dirs()

    def _ensure_dirs(self) -> None:
        for path in self._dirs.values():
            path.mkdir(parents=True, exist_ok=True)

    def get_root_dir(self) -> Path:
        """Get the root directory for local storage.

        Returns
        -------
        Path
            The root directory path for local storage.
        """
        return self._local_root

    def get_uploads_dir(self) -> Path:
        """Get the uploads directory for local storage.

        Returns
        -------
        Path
            The uploads directory path.
        """
        return self._dirs["uploads"]

    def get_docs_dir(self) -> Path:
        """Get the documents directory for local storage.

        Returns
        -------
        Path
            The documents directory path.
        """
        return self._dirs["docs"]

    def get_parsed_docs_dir(self) -> Path:
        """Get the parsed documents directory for local storage.

        Returns
        -------
        Path
            The parsed documents directory path.
        """
        return self._dirs["parsed_docs"]

    def get_embeddings_dir(self) -> Path:
        """Get the embeddings directory for local storage.

        Returns
        -------
        Path
            The embeddings directory path.
        """
        return self._dirs["embeddings"]

    def get_chroma_db_dir(self) -> Path:
        """Get the Chroma DB directory for local storage.

        Returns
        -------
        Path
            The Chroma DB directory path.
        """
        return self._dirs["chroma"]

    def _resolve_dir(self, target_dir: str) -> Path:
        """Resolve the target directory to a Path object.

        Parameters
        ----------
        target_dir : str
            The target directory name.

        Returns
        -------
        Path
            The resolved directory path.

        Raises
        ------
        ValueError
            If the target directory is invalid.
        """
        if target_dir not in self._dirs:
            raise ValueError(f"Invalid target directory: {target_dir}")
        return self._dirs[target_dir]

    def save_file(
        self,
        file: Union[str, Path, bytes],
        target_dir: str,
        filename: Optional[str] = None,
        content: Optional[bytes] = None,
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
        content : Optional[bytes], optional
            The content to write to the file, by default None.

        Returns
        -------
        Path
            The path where the file was saved.

        Raises
        ------
        TypeError
            If the file type is not supported (must be str, Path, or bytes).
        ValueError
            If the filename is not provided when saving bytes.
        """
        target_path = self._resolve_dir(target_dir)
        if isinstance(file, (str, Path)):
            file_path = Path(file)
            if not filename:
                filename = file_path.name
            target_file_path = target_path / filename
            shutil.copy(file_path, target_file_path)
        elif isinstance(file, bytes):
            if not filename:
                raise ValueError("Filename must be provided when saving bytes.")
            target_file_path = target_path / filename
            with open(target_file_path, "wb") as f:
                f.write(file)
        else:
            raise TypeError(
                "Unsupported file type. Must be str, Path, or bytes."
            )

        if content is not None:
            with open(target_file_path, "wb") as f:
                f.write(content)

        return target_file_path

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
        target_path = self._resolve_dir(target_dir)
        return list(target_path.glob("*"))

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
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        if file_path.exists():
            file_path.unlink()
            return True
        return False

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

        Raises
        ------
        FileNotFoundError
            If the file does not exist in the specified directory.
        ValueError
            If the specified path is not a file.
        """
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        if not file_path.exists():
            raise FileNotFoundError(
                f"File {filename} not found in {target_dir}."
            )
        if not file_path.is_file():
            raise ValueError(f"{filename} is not a file.")
        with open(file_path, "rb") as f:
            return f.read()

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
        target_path = self._resolve_dir(target_dir)
        return (target_path / filename).exists()

    def get_file_path(self, target_dir: str, filename: str) -> Path | None:
        """Get the full path to a file in the specified directory.

        Parameters
        ----------
        target_dir : str
            The directory to search in.
        filename : str
            The name of the file to find.

        Returns
        -------
        Path
            The full path to the file, or None if it does not exist.
        """
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        return file_path if file_path.exists() else None

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
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        with open(file_path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, indent=indent)
        return file_path

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
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        async with aiofiles.open(
            file_path, "w", encoding="utf-8", newline="\n"
        ) as f:
            await f.write(json.dumps(data, indent=indent))
        return file_path

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

        Raises
        ------
        FileNotFoundError
            If the JSON file does not exist in the specified directory.
        """
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        if not file_path.exists():
            raise FileNotFoundError(
                f"JSON file {filename} not found in {target_dir}."
            )
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

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

        Raises
        ------
        FileNotFoundError
            If the JSON file does not exist in the specified directory.
        """
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        if not file_path.exists():
            raise FileNotFoundError(
                f"JSON file {filename} not found in {target_dir}."
            )
        async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
            return json.loads(await f.read())

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

        Raises
        ------
        FileNotFoundError
            If the file does not exist in the specified directory.
        """
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        if not file_path.exists():
            raise FileNotFoundError(
                f"File {filename} not found in {target_dir}."
            )
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()

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
        target_path = self._resolve_dir(target_dir)
        file_path = target_path / filename
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        return file_path
