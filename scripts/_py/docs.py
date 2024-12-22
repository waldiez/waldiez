"""Generate docs in projects that have a mkdocs.yml file."""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False

try:
    from _lib import ROOT_DIR, get_python_projects, run_command
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import ROOT_DIR, get_python_projects, run_command  # type: ignore

    HAD_TO_MODIFY_SYS_PATH = True


def make_docs(package_dir: Path) -> None:
    """Generate the documentation in a sub-package.

    Parameters
    ----------
    package_dir : Path
        The package directory.
    """
    docs_py_script = package_dir / "scripts" / "docs.py"
    if not docs_py_script.exists():
        print(f"Docs script not found in {package_dir}, skipping ...")
        return
    # base_url = {this.repo_url}/{package_dir.name}
    print(f"Generating docs for {package_dir.name} ...")
    output_dir = ROOT_DIR / "site" / package_dir.name
    run_command(
        [sys.executable, str(docs_py_script), "--output", str(output_dir)],
        cwd=package_dir,
    )


def main() -> None:
    """Generate the documentation."""
    for package_dir in get_python_projects():
        make_docs(package_dir)


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
