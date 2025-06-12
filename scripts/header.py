# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=broad-except,too-many-try-statements

"""Ensure a notice with the license and the copyright exists in every py."""

import os
import re
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

START_YEAR = 2024
LICENSE_LINE = "# SPDX-License-Identifier: Apache-2.0."
HOLDER = "Waldiez and contributors."
DIRECTORIES_TO_SCAN = [
    str(ROOT_DIR / "waldiez"),
    str(ROOT_DIR / "tests"),
    str(ROOT_DIR / "scripts"),
]


def get_first_lines(file_path: str) -> tuple[str, str, str]:
    """Get the first two lines of a file.

    Parameters
    ----------
    file_path : str
        The path to the file.

    Returns
    -------
    tuple[str, str, str]
        The first two lines and the remaining content.

    Raises
    ------
    RuntimeError
        If an error occurs while reading the file.
    """
    try:
        with open(file_path, "r", encoding="utf-8", newline="\n") as f:
            first_line = f.readline().strip()
            second_line = f.readline().strip()
            remaining_content = f.read()
        return first_line, second_line, remaining_content
    except BaseException as e:
        raise RuntimeError(f"Error reading file {file_path}: {e}") from e


def update_file(
    file_path: str,
    license_line: str,
    copyright_line: str,
    remaining_content: str,
) -> None:
    """Update the specified file.

    Parameters
    ----------
    file_path : str
        The path to the file.
    license_line : str
        The license line to add.
    copyright_line : str
        The copyright line to add.
    remaining_content : str
        The remaining content of the file.

    Raises
    ------
    RuntimeError
        If an error occurs while updating the file.
    """
    try:
        with open(file_path, "w", encoding="utf-8", newline="\n") as f:
            first_lines = f"{license_line}" + "\n" + f"{copyright_line}" + "\n"
            f.write(first_lines)
            f.write(remaining_content)
        print(f"Updated file: {file_path}")
    except BaseException as e:
        raise RuntimeError(f"Error updating file {file_path}: {e}") from e


def process_copyright_line(
    second_line: str, start_year: int, holder: str
) -> str:
    """Ensure the copyright line has the correct year range.

    Parameters
    ----------
    second_line : str
        The second line of the file.
    start_year : int
        The start year of the project.
    holder : str
        The holder of the license.

    Returns
    -------
    str
        The updated second line.
    """
    current_year = datetime.now().year
    copyright_regex = re.compile(
        rf"# Copyright \(c\) {start_year}(?: - (\d{{4}}))? (.+)"
    )
    match = copyright_regex.match(second_line)
    if match:
        end_year, found_holder = match.groups()
        if end_year == str(current_year):  # No change needed
            return second_line
        # Update to include the current year
        return f"# Copyright (c) {start_year} - {current_year} {found_holder}"
    # Create a new line if missing or malformed
    return f"# Copyright (c) {start_year} - {current_year} {holder}"


def ensure_license_and_copyright(
    directories: list[str],
    license_line: str,
    start_year: int,
    holder: str,
) -> None:
    """Ensure license and copyright notice in Python files.

    Parameters
    ----------
    directories : list[str]
        The list of directories to scan.
    license_line : str
        The SPDX license identifier.
    start_year : int
        The start year of the project.
    holder : str
        The holder of the license.

    Raises
    ------
    RuntimeError
        If an error occurs while processing a file.
    """
    for directory in directories:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith(".py"):
                    file_path = os.path.join(root, file)
                    first_line, second_line, remaining_content = (
                        get_first_lines(file_path)
                    )
                    needs_update = False
                    if first_line != license_line:
                        needs_update = True
                        remaining_content = (
                            first_line + "\n" + remaining_content
                        )

                    updated_copyright_line = process_copyright_line(
                        second_line, start_year, holder
                    )

                    if second_line != updated_copyright_line:
                        needs_update = True
                        remaining_content = (
                            second_line + "\n" + remaining_content
                        )
                    if needs_update:
                        update_file(
                            file_path,
                            license_line,
                            updated_copyright_line,
                            remaining_content,
                        )


def main() -> None:
    """Run the script."""
    ensure_license_and_copyright(
        directories=DIRECTORIES_TO_SCAN,
        license_line=LICENSE_LINE,
        start_year=START_YEAR,
        holder=HOLDER,
    )


if __name__ == "__main__":
    main()
