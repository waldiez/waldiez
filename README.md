# Waldiez

![CI Build](https://github.com/waldiez/python/actions/workflows/main.yaml/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/waldiez/python/badge.svg)](https://coveralls.io/github/waldiez/python) [![PyPI version](https://badge.fury.io/py/waldiez.svg?icon=si%3Apython)](https://badge.fury.io/py/waldiez) [![npm version](https://badge.fury.io/js/@waldiez%2Freact.svg)](https://badge.fury.io/js/@waldiez%2Freact)

Translate a Waldiez flow:

![Flow](https://raw.githubusercontent.com/waldiez/python/refs/heads/main/docs/static/images/overview.webp)

To a python script or a jupyter notebook with the corresponding [ag2](https://github.com/ag2ai/ag2/) agents and chats.

## Features

- Convert .waldiez flows to .py or .ipynb
- Run a .waldiez flow
- Store the runtime logs of a flow to csv for further analysis

## Installation

On PyPI:

```bash
python -m pip install waldiez
```

From the repository:

```bash
python -m pip install git+https://github.com/waldiez/waldiez.git
```

## Usage

### UI Options

- For creating-only (no exporting or running) waldiez flows, you can use the playground at <https://waldiez.github.io>.
- There is also a jupyterlab extension [here](https://github.com/waldiez/jupyter)
- You also can use the vscode extension:
  - [repo](https://github.com/waldiez/vscode)
  - [marketplace](https://marketplace.visualstudio.com/items?itemName=Waldiez.waldiez-vscode)
- Finally, you can use [waldiez-studio](https://github.com/waldiez/studio), which includes a FastAPI app to handle the conversion and running of waldiez flows.

The jupyterlab extension and waldiez studio are also provided as extras in the main package.

```shell
pip install waldiez[studio]  # or pip install waldiez_studio
pip install waldiez[jupyter]  # or pip install waldiez_jupyter
# or both
pip install waldiez[studio,jupyter]
```

### CLI

```bash
# Convert a Waldiez flow to a python script or a jupyter notebook
waldiez convert --file /path/to/a/flow.waldiez --output /path/to/an/output/flow[.py|.ipynb]
# Convert and run the script, optionally force generation if the output file already exists
waldiez run --file /path/to/a/flow.waldiez --output /path/to/an/output/flow[.py] [--force]
```

### Using docker/podman

```shell
CONTAINER_COMMAND=docker # or podman
# pull the image
$CONTAINER_COMMAND pull waldiez/waldiez
# Convert a Waldiez flow to a python script or a jupyter notebook
$CONTAINER_COMMAND run \
  --rm \
  -v /path/to/a/flow.waldiez:/flow.waldiez \
  -v /path/to/an/output:/output \
  waldiez/waldiez convert --file /flow.waldiez --output /output/flow[.py|.ipynb] [--force]

# with selinux and/or podman, you might get permission (or file not found) errors, so you can try:
$CONTAINER_COMMAND run \
  --rm \
  -v /path/to/a/flow.waldiez:/flow.waldiez \
  -v /path/to/an/output:/output \
  --userns=keep-id \
  --security-opt label=disable \
  waldiez/waldiez convert --file /flow.waldiez --output /output/flow[.py|.ipynb] [--force]
```

```shell
# Convert and run the script
$CONTAINER_COMMAND run \
  --rm \
  -v /path/to/a/flow.waldiez:/flow.waldiez \
  -v /path/to/an/output:/output \
  waldiez/waldiez run --file /flow.waldiez --output /output/output[.py]
```

### As a library

#### Export a flow

```python
# Export a Waldiez flow to a python script or a jupyter notebook
from waldiez import WaldiezExporter
flow_path = "/path/to/a/flow.waldiez"
output_path = "/path/to/an/output.py"  # or .ipynb
exporter = WaldiezExporter.load(flow_path)
exporter.export(output_path)
```

#### Run a flow

```python
# Run a flow
from waldiez import WaldiezRunner
flow_path = "/path/to/a/flow.waldiez"
output_path = "/path/to/an/output.py"
runner = WaldiezRunner.load(flow_path)
runner.run(output_path=output_path)
```

### Tools

- [ag2 (formerly AutoGen)](https://github.com/ag2ai/ag2)
- [juptytext](https://github.com/mwouts/jupytext)
- [pydantic](https://github.com/pydantic/pydantic)
- [typer](https://github.com/fastapi/typer)
- [asyncer](https://github.com/fastapi/asyncer)

## Known Conflicts

- **autogen-agentchat**: This package conflicts with `ag2` / `pyautogen`. Ensure that `autogen-agentchat` is uninstalled before installing `waldiez`. If you have already installed `autogen-agentchat`, you can uninstall it with the following command:

  ```shell
  pip uninstall autogen-agentchat -y
  ```

  If already installed waldiez you might need to reinstall it after uninstalling `autogen-agentchat`:

  ```shell
  pip install --force --no-cache waldiez pyautogen
  ```

## License

This project is licensed under the [Apache License, Version 2.0 (Apache-2.0)](https://github.com/waldiez/waldiez/blob/main/LICENSE).
