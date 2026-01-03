# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=broad-exception-raised
"""Check if we can load and convert the examples in the git repo.

No model api keys or tool secrets files are checked.
If conversion fails or if the outputs in
../.local/examples/[x]/[y].py are not as expected,
something is wrong with latest changes in the codebase.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import urllib3
from jsonschema import validate
from urllib3 import Timeout

try:
    from waldiez.exporter import WaldiezExporter
except ImportError:
    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from waldiez.exporter import WaldiezExporter

from waldiez.exporting import ExporterError
from waldiez.logger import WaldiezLogger

ROOT_DIR = Path(__file__).resolve().parents[1]
DOT_LOCAL = ROOT_DIR / ".local"
DOT_LOCAL.mkdir(exist_ok=True, parents=True)

# Git repo details
BRANCH = "main"
REPO = "waldiez/waldiez"
REPO_URL = (
    f"https://raw.githubusercontent.com/{REPO}/refs/heads/{BRANCH}/examples"
)

EXAMPLES_CWD = ROOT_DIR / "examples"


def _get_examples() -> list[str]:
    base = Path(EXAMPLES_CWD)
    examples = [
        str(p.relative_to(base)).replace("\\", "/")
        for p in base.glob("[0-9][0-9] -*/*.waldiez")
    ]
    examples.sort(key=lambda p: int(p.split("-", 1)[0]))
    return examples


EXAMPLES = _get_examples()
LOG = WaldiezLogger()


def load_shared_schema() -> dict[str, Any]:
    """Load the shared with ts schema.

    Returns
    -------
    dict[str, Any]
        The shared with ts schema.
    """
    schema_path = Path(__file__).parent.parent / "schema.json"
    with open(schema_path, "r", encoding="utf-8") as schema_file:
        schema = json.load(schema_file)
    return schema


def download_example(
    http: urllib3.PoolManager, example_url: str, example_path: str
) -> None:
    """Download an example from the git repo.

    Parameters
    ----------
    http : urllib3.PoolManager
        The pool manager.
    example_url : str
        The URL of the example.
    example_path : str
        The path to save the example.

    Raises
    ------
    Exception
        If the download fails.
    """
    # pylint: disable=line-too-long
    response = http.request(
        "GET",
        example_url,
        headers={
            "Cache-Control": "no-cache",
        },
    )  # type: ignore[unused-ignore,no-untyped-call]  # noqa: E501
    if response.status != 200:
        raise Exception(f"Failed to download {example_url}")
    flow_data = json.loads(response.data.decode("utf-8"))
    with open(example_path, "w", encoding="utf-8") as file:
        json.dump(flow_data, file)


def move_to_dot_local(
    example_dir: str, example_path: str, flow_name: str
) -> None:
    """Move the converted example to the .local directory.

    Parameters
    ----------
    example_dir : str
        The directory of the example.
    example_path : str
        The path to the example.
    flow_name : str
        The name of the flow.
    """
    example_name = os.path.basename(example_path)
    dot_local_dir = os.path.join(DOT_LOCAL, "examples", example_dir)
    os.makedirs(dot_local_dir, exist_ok=True)
    dot_local_path = os.path.join(dot_local_dir, example_name)
    shutil.move(example_path, dot_local_path)
    dot_local_py_path = dot_local_path.replace(".waldiez", ".py")
    shutil.move(example_path.replace(".waldiez", ".py"), dot_local_py_path)
    dot_local_ipynb_path = dot_local_path.replace(".waldiez", ".ipynb")
    shutil.move(
        example_path.replace(".waldiez", ".ipynb"), dot_local_ipynb_path
    )
    # check for {flow_name}_api_keys.py
    flow_name_ = flow_name.replace(" ", "_").replace("-", "_").lower()
    example_path_dir = os.path.dirname(example_path)
    api_keys_path = os.path.join(example_path_dir, f"{flow_name_}_api_keys.py")
    if os.path.exists(api_keys_path):
        dst = os.path.join(dot_local_dir, f"{flow_name_}_api_keys.py")
        if os.path.exists(dst):
            os.remove(dst)
        shutil.move(api_keys_path, dst)
    secrets_ending = "_secrets.py"
    for file in os.listdir(example_path_dir):
        if file.endswith(secrets_ending):
            src = os.path.join(example_path_dir, file)
            dst = os.path.join(dot_local_dir, file)
            if os.path.exists(dst):
                os.remove(dst)
            shutil.move(src, dst)


def validate_example(example_path: str) -> None:
    """Validate the example against the shared schema.

    Parameters
    ----------
    example_path : str
        The path to the example.

    Raises
    ------
    AssertionError
        If the example is not valid.
    """
    with open(example_path, "r", encoding="utf-8") as file:
        flow_data = json.load(file)
    shared_schema = load_shared_schema()
    file_name = os.path.basename(example_path)
    try:
        validate(instance=flow_data, schema=shared_schema)
    except Exception as e:
        raise AssertionError(f"Example {file_name} is not valid: {e}") from e
    LOG.success(f"Example {file_name} is valid.")


def convert_remote_examples() -> None:
    """Check if we can load and convert the examples in the git repo.

    Raises
    ------
    Exception
        If the conversion fails.
    """
    temp_dir = tempfile.mkdtemp()
    timeout = Timeout(connect=10.0, read=30.0)
    http = urllib3.PoolManager(timeout=timeout)
    for example in EXAMPLES:
        example_dir = os.path.dirname(example)
        example_url = f"{REPO_URL}/{example}"
        if sys.platform == "win32":
            example_ = example.replace("\\", "/")
            example_url = f"{REPO_URL}/{example_}"
        example_path = os.path.join(temp_dir, example)
        os.makedirs(os.path.dirname(example_path), exist_ok=True)
        LOG.info("Downloading %s ...", example)
        download_example(http, example_url, example_path)
        LOG.info("Validating %s ...", example)
        validate_example(example_path)
        LOG.info("Converting %s to py...", example)
        exporter = WaldiezExporter.load(Path(example_path))
        output_py_path = example_path.replace(".waldiez", ".py")
        exporter.export(output_py_path, force=True)
        if not os.path.exists(output_py_path):
            raise ExporterError(f"Failed to convert {example} to py")
            # raise Exception(f"Failed to convert {example}")
        LOG.info("Converting %s to ipynb...", example)
        output_ipynb_path = example_path.replace(".waldiez", ".ipynb")
        exporter.export(output_ipynb_path, force=True)
        if not os.path.exists(output_ipynb_path):
            raise ExporterError(f"Failed to convert {example} to ipynb")
        move_to_dot_local(example_dir, example_path, exporter.waldiez.name)
        LOG.success("Example %s looks good ...", example)
    shutil.rmtree(temp_dir)


def validate_local_example(example_dir: str, example_path: str) -> None:
    """Check if the example already exists locally.

    Parameters
    ----------
    example_dir : str
        The directory of the example.
    example_path : str
        The path to the example.
    """
    local_dir = os.path.join(ROOT_DIR, "examples", example_dir)
    local_path = os.path.join(local_dir, os.path.basename(example_path))
    if os.path.exists(local_path):
        validate_example(local_path)
        return
    LOG.warning("Example %s does not exist locally.", local_path)


def diff_has_only_id_changes(file_path: str) -> bool:
    """Check if the diff of a file contains only 'id: ...' changes.

    Parameters
    ----------
    file_path : str
        The path to the file.

    Returns
    -------
    bool
        True if the diff contains only 'id: ...' changes, False otherwise.
    """
    git_diff_cmd = ["git", "diff", "--", file_path]
    result = subprocess.run(  # nosemgrep # nosec
        git_diff_cmd,
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8",
        cwd=str(EXAMPLES_CWD),
    )
    diff_output = result.stdout.strip()

    # If no diff, return True (no changes)
    if not diff_output.strip():
        return True
    # Split into lines and filter for actual changes (+ and - lines)
    lines = diff_output.split("\n")

    # Get only the actual change lines (+ and - lines, excluding file headers)
    change_lines = [
        line
        for line in lines
        if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
    ]

    # Pattern to match ID lines: starts with +/-, whitespace, "id": "value",
    id_pattern = r'^[+-]\s+"id":\s+"[^"]+",?\s*$'

    # Check if ALL change lines match the ID pattern
    for line in change_lines:
        if not re.match(id_pattern, line):
            return False

    return True


def git_restore(*files: str) -> None:
    """Restore files in the git staging area.

    Parameters
    ----------
    files : tuple[str, ...]
        The files to restore.

    Raises
    ------
    RuntimeError
        If the git restore command fails.
    """
    git_restore_cmd = ["git", "restore"] + list(files)
    result = subprocess.run(  # nosemgrep # nosec
        git_restore_cmd,
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8",
        cwd=str(EXAMPLES_CWD),
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Failed to restore git staging area: {result.stderr}"
        )


# pylint: disable=too-many-return-statements
def diff_has_path_changes(file_path: str) -> bool:
    """Check if the diff of a file contains path changes.

    Paths might be defined as relative in .waldiez
    but resolved on conversion to absolute paths in .py and .ipynb.
    so we check if ROOT_DIR is in the diff.

    Parameters
    ----------
    file_path : str
        The path to the file.

    Returns
    -------
    bool
        True if the diff contains path changes, False otherwise.
    """
    git_diff_cmd = ["git", "diff", "--", file_path]
    result = subprocess.run(  # nosemgrep # nosec
        git_diff_cmd,
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8",
        cwd=str(EXAMPLES_CWD),
    )
    diff_output = result.stdout.strip()

    # If no diff, return False (no changes)
    if not diff_output.strip():
        return False
    # Check if ROOT_DIR is in the diff output
    if str(ROOT_DIR) in diff_output:
        return True
    # let's also check more generally for path changes
    if str(Path.home()) in diff_output:
        return True
    if "path=" in diff_output:
        idx = diff_output.index("path=")
        remaining = diff_output[idx + 5 :].lstrip()
        if remaining.startswith("os.getcwd()") or remaining.startswith(
            "Path.cwd()"
        ):
            return False
        if remaining.startswith('"."') or remaining.startswith("'."):
            return False  # relative
        if remaining.startswith('\\"chroma\\",\\n"') or remaining.startswith(
            "output_path"
        ):
            return False
        print(remaining[:100])
        return True
    return False


def convert_local_example(example_path: str) -> None:
    """Convert the local example to py and ipynb.

    Parameters
    ----------
    example_path : str
        The path to the example.

    Raises
    ------
    Exception
        If the conversion fails.
    """
    exporter = WaldiezExporter.load(Path(example_path))
    output_py_path = example_path.replace(".waldiez", ".py")
    exporter.export(output_py_path, force=True)
    if not os.path.exists(output_py_path):
        raise ExporterError(f"Failed to convert {example_path} to py")
    try:
        lint_example(output_py_path)
    except Exception as e:
        _log = f"Error linting local example {example_path}: {e}"
        LOG.error(_log)
        raise e
    output_ipynb_path = example_path.replace(".waldiez", ".ipynb")
    exporter.export(output_ipynb_path, force=True)
    if not os.path.exists(output_ipynb_path):
        raise ExporterError(f"Failed to convert {example_path} to ipynb")
    try:
        lint_example(output_ipynb_path)
    except Exception as e:
        _log = f"Error linting local example {example_path}: {e}"
        LOG.error(_log)
        raise e
    replace_root_dir_in_py(output_py_path)
    replace_root_dir_in_ipynb(output_ipynb_path)
    check_diffs(output_ipynb_path, output_py_path)


def replace_root_dir_in_ipynb(file_path: str) -> None:
    """Replace the ROOT_DIR in the ipynb file.

    Parameters
    ----------
    file_path : str
        The path to the ipynb file.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    should_update = False
    if str(ROOT_DIR) in content:
        patterns_to_try: list[str] = [
            rf'r\\"{re.escape(str(ROOT_DIR))}{re.escape(os.path.sep)}',
            rf'r\\"({re.escape(str(ROOT_DIR))}{re.escape(os.path.sep)})',
            rf'\\"{re.escape(str(ROOT_DIR))}{re.escape(os.path.sep)}',
            rf'r"{re.escape(str(ROOT_DIR))}{re.escape(os.path.sep)}',
            rf'"({re.escape(str(ROOT_DIR))}{re.escape(os.path.sep)})',
        ]

        for i, pattern in enumerate(patterns_to_try):
            if re.search(pattern, content):
                should_update = True
                if i == 0:  # r\"ROOT_DIR/
                    content = re.sub(pattern, r"\"", content)
                    break
                if i == 1:  # r\"(ROOT_DIR/)
                    content = re.sub(pattern, r"\"", content)
                    break
                if i == 2:  # \"ROOT_DIR/
                    content = re.sub(pattern, r"\"", content)
                    break
                if i == 3:  # r"ROOT_DIR/
                    content = re.sub(pattern, r'"', content)
                    break
                if i == 4:  # "(ROOT_DIR/)
                    content = re.sub(pattern, r'"', content)
                    break
    if should_update:
        with open(file_path, "w", encoding="utf-8", newline="\n") as file:
            file.write(content)


def replace_root_dir_in_py(file_path: str) -> None:
    """Replace the ROOT_DIR in the file.

    Parameters
    ----------
    file_path : str
        The path to the file.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    should_update = False
    root_pattern = (
        rf'r?(["\']){re.escape(str(ROOT_DIR))}{re.escape(os.path.sep)}'
    )
    if re.search(root_pattern, content):
        content = re.sub(root_pattern, r"\1", content)
        should_update = True
    if should_update:
        with open(file_path, "w", encoding="utf-8", newline="\n") as file:
            file.write(content)


# pylint: disable=broad-exception-caught
# noinspection PyBroadException
def check_diffs(output_ipynb_path: str, output_py_path: str) -> None:
    """Check if the diffs of the converted files are as expected.

    Parameters
    ----------
    output_ipynb_path : str
        The path to the output ipynb file.
    output_py_path : str
        The path to the output py file.
    """
    # let's git restore the ipynb if needed (only cell id changes)
    # (no need to commit the new "id: ..." changes)
    if diff_has_only_id_changes(output_ipynb_path):
        try:
            git_restore(output_ipynb_path)
        except BaseException:
            pass
    if diff_has_path_changes(output_ipynb_path):
        LOG.warning("The converted .ipynb file has path changes.")
        try:
            git_restore(output_ipynb_path)
        except BaseException:
            pass
    if diff_has_path_changes(output_py_path):
        LOG.warning("The converted .py file has path changes.")
        try:
            git_restore(output_py_path)
        except BaseException:
            pass


def lint_example(example_path: str) -> None:
    """Lint the local example.

    Parameters
    ----------
    example_path : str
        The path to the example.

    Raises
    ------
    Exception
        If the linting fails.
    """
    # black and mypy
    to_call = [
        "black",
        "mypy",
    ]
    example_file_name = os.path.basename(example_path)
    for tool in to_call:
        if example_path.endswith(".ipynb") and tool == "mypy":
            continue
        result = subprocess.run(
            [tool, example_path],
            capture_output=True,
            encoding="utf-8",
            text=True,
            check=True,
        )
        LOG.info(
            "Linting %s with %s:\n%s",
            f'"{example_file_name}"',
            tool,
            result.stdout,
        )
        if result.returncode != 0:
            raise ExporterError(
                f"Linting failed for {example_path}: {result.stderr}"
            ) from None


def convert_local_examples() -> None:
    """Check if the examples exist locally and validate them.

    Raises
    ------
    Exception
        If the validation fails for any example.
    """
    for example in EXAMPLES:
        example_dir = os.path.dirname(example)
        example_path = os.path.join(ROOT_DIR, "examples", example)
        try:
            validate_local_example(example_dir, example_path)
        except Exception as e:
            _log = f"Error validating local example {example}: {e}"
            LOG.error(_log)
            raise e
        LOG.success(
            f"Local example {example} looks valid.",
        )
        try:
            convert_local_example(example_path)
        except Exception as e:
            _log = f"Error converting local example {example}: {e}"
            LOG.error(_log)
            raise e
        try:
            lint_example(example_path.replace(".waldiez", ".py"))
            lint_example(example_path.replace(".waldiez", ".ipynb"))
        except Exception as e:
            _log = f"Error linting local example {example}: {e}"
            LOG.error(_log)
            raise e
        LOG.success(f"Local example {example} linted successfully.")


def handle_remote() -> None:
    """Handle remote examples."""
    LOG.info("Checking remote examples...")
    try:
        convert_remote_examples()
        LOG.success("Remote examples validated and converted.")
    except Exception as e:  # pylint: disable=broad-exception-caught
        LOG.error("Error during remote conversion: %s", e)
        sys.exit(1)


def handle_local() -> None:
    """Handle local examples."""
    LOG.info("Checking local examples...")
    try:
        convert_local_examples()
        LOG.success("Local examples validated and converted.")
    except Exception as e:  # pylint: disable=broad-exception-caught
        LOG.error("Error during local conversion: %s", e)
        sys.exit(1)


def main() -> None:
    """Handle local and remote examples."""
    do_local = "--local" in sys.argv or len(sys.argv) == 1
    do_remote = "--remote" in sys.argv or len(sys.argv) == 1
    if not do_local and not do_remote:
        do_local = True
        do_remote = True
    if do_local:
        handle_local()
    if do_remote:
        handle_remote()


if __name__ == "__main__":
    main()
