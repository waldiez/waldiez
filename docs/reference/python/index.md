# Waldiez

Translate a Waldiez flow:

<img fetchpriority="high" alt="Waldiez flow" src="../../static/images/overview.webp#only-light" />
<img fetchpriority="high" alt="Waldiez flow" src="../../static/images/overview_dark.webp#only-dark" />

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
python -m pip install git+https://github.com/waldiez/python.git
```

!!! note
    `autogen-agentchat` package conflicts with `ag2` / `pyautogen`. Ensure that `autogen-agentchat` is uninstalled before installing `waldiez`. If you have already installed `autogen-agentchat`, you can uninstall it with the following command:

        ```shell
        pip uninstall autogen-agentchat -y
        ```

        If already installed waldiez you might need to reinstall it after uninstalling `autogen-agentchat`:

        ```shell
        pip install --force --no-cache waldiez pyautogen
        ```

## Usage

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

### UI

For creating-only (no exporting or running) waldiez flows, you can use the playground at <https://waldiez.github.io>.
The repo for the js library is [here](https://github.com/waldiez/react).
We are currently working on waldiez-studio to provide a visual interface for creating and running Waldiez flows (you can find more [here](https://github.com/waldiez/studio)).
Until then, you can use our [Jupyter](https://github.com/waldiez/jupyter) or the [VSCode](https://github.com/waldiez/vscode) extension to create and run Waldiez flows.

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
