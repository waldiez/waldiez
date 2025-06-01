# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Check if we can load and convert the examples in the git repo.

No model api keys or tool secrets files are checked.
If conversion fails or if the outputs in
../.local/examples/[x]/[y].py are not as expected,
something is wrong with latest changes in the codebase.
"""

import json
import os
import shutil
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

from waldiez.logger import WaldiezLogger

ROOT_DIR = Path(__file__).resolve().parents[1]
DOT_LOCAL = ROOT_DIR / ".local"
DOT_LOCAL.mkdir(exist_ok=True, parents=True)

REPO_URL = (
    "https://raw.githubusercontent.com/waldiez/waldiez/refs/heads/next/examples"
)
EXAMPLES = [
    "01 - Standup Comedians/Standup Comedians 1.waldiez",
    "01 - Standup Comedians/Standup Comedians 2.waldiez",
    "01 - Standup Comedians/Standup Comedians 3.waldiez",
    "02 - On-boarding/On-boarding.waldiez",
    "02 - On-boarding/On-boarding Async.waldiez",
    "03 - Reflection/Reflection.waldiez",
    "04 - Tools/Tool Use.waldiez",
    "05 - Coding/Coding.waldiez",
    # "06 - Planning/Planning 1.waldiez",
    # "07 - Group chat with RAG/RAG.waldiez",
    "08 - ReAct using Tavily/ReAct.waldiez",
    # "09 - AutoDefence/AutoDefense Flow.waldiez",
    # "10 - Travel Planning/Travel Planning.waldiez",
    # "11 - Swarm/Swarm.waldiez",
    "12 - Reasoning/Chain-of-Thought Reasoning with DFS.waldiez",
    "13 - Captain/1 - Simple.waldiez",
    "13 - Captain/2 - With agent lib.waldiez",
    "13 - Captain/3 - With agent lib and tool lib.waldiez",
]


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
    response = http.request("GET", example_url)  # type: ignore[unused-ignore,no-untyped-call]  # noqa: E501
    if response.status != 200:
        # pylint: disable=broad-exception-raised
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


def convert_examples() -> None:
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
        example_path = os.path.join(temp_dir, example)
        os.makedirs(os.path.dirname(example_path), exist_ok=True)
        LOG.info("Downloading %s ...", example)
        download_example(http, example_url, example_path)
        LOG.info("Validating %s ...", example)
        validate_example(example_path)
        LOG.info("Converting %s to py...", example)
        exporter = WaldiezExporter.load(Path(example_path))
        output_py_path = example_path.replace(".waldiez", ".py")
        exporter.export(output_py_path, True)
        if not os.path.exists(output_py_path):
            # pylint: disable=broad-exception-raised
            raise Exception(f"Failed to convert {example}")
        LOG.info("Converting %s to ipynb...", example)
        output_ipynb_path = example_path.replace(".waldiez", ".ipynb")
        exporter.export(output_ipynb_path, True)
        if not os.path.exists(output_ipynb_path):
            # pylint: disable=broad-exception-raised
            raise Exception(f"Failed to convert {example} to ipynb")
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


def check_local_examples() -> None:
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


def main() -> None:
    """Handle local and remote examples."""
    LOG.info("Checking local examples...")
    check_local_examples()
    try:
        convert_examples()
        LOG.info(
            "All examples validated and converted successfully.",
        )
    except Exception as e:  # pylint: disable=broad-exception-caught
        LOG.error("Error during conversion: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
