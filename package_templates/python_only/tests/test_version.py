"""Test the package version."""

from pathlib import Path

import my_package


def _read_version() -> str:
    """Read the version from the package."""
    version_py = Path(__file__).parent.parent / "my_package" / "_version.py"
    version = "0.0.0"
    with version_py.open() as f:
        for line in f:
            if line.startswith("__version__"):
                version = line.split()[-1].strip('"').strip("'")
                break
    return version


def test_version() -> None:
    """Test __version__."""
    from_file = _read_version()
    assert from_file != "0.0.0"
    assert my_package.__version__ == from_file
