"""Build the documentation for my_package."""

import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
DOCS_DIR = ROOT_DIR / "docs"


def build_docs(output_dir: Path) -> None:
    """Build the documentation.

    Parameters
    ----------
    output_dir : Path
        The output directory.
    """
    subprocess.run(  # nosemgrep # nosec
        [
            sys.executable,
            "-m",
            "mkdocs",
            "build",
            "-d",
            str(output_dir),
        ],
        check=True,
        cwd=ROOT_DIR,
    )


def main() -> None:
    """Build the documentation."""
    output = ROOT_DIR / "site"
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            output = Path(sys.argv[idx + 1])
    build_docs(output)


if __name__ == "__main__":
    main()
