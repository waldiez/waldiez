# Waldiez

[![Coverage Status](https://coveralls.io/repos/github/waldiez/waldiez/badge.svg)](https://coveralls.io/github/waldiez/waldiez) [![PyPI Downloads](https://static.pepy.tech/badge/waldiez)](https://pepy.tech/projects/waldiez) [![PyPI version](https://badge.fury.io/py/waldiez.svg?icon=si%3Apython)](https://badge.fury.io/py/waldiez) [![npm version](https://badge.fury.io/js/@waldiez%2Freact.svg)](https://badge.fury.io/js/@waldiez%2Freact)

## Make AG2 Agents Collaborate: Drag, Drop, and Orchestrate with Waldiez

Design AI Agents and translate a Waldiez flow to [AG2](https://github.com/ag2ai/ag2/):

<video src="https://github.com/user-attachments/assets/71d4b8d1-a24b-45ab-ab53-dfc193e8fcaa" controls="controls" autoplay="autoplay" loop="loop" muted="muted" playsinline="playsinline" width="100%" height="100%"></video>

## Features

- Convert .waldiez flows to .py or .ipynb
- Run a .waldiez flow
- Store the runtime logs of a flow to csv for further analysis

## Installation

### Python

On PyPI:

```shell
python -m pip install waldiez
```

From the repository:

```shell
python -m pip install git+https://github.com/waldiez/waldiez.git
```

### React Component

If you’re looking for the React component, please refer to [README.npm](https://github.com/waldiez/waldiez/blob/main/README.npm.md).

> Note: The React component is only for creating and editing flows — it is not needed to convert or run flows (that functionality is handled by the Python package).

To include waldiez on your website using CDN, here is a simple example:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@19.1.0",
              "react-dom/client": "https://esm.sh/react-dom@19.1.0/client",
              "@waldiez/react": "https://esm.sh/@waldiez/react"
            }
          }
        </script>
        <style>
            body {
                margin: 0;
                padding: 0;
                justify-content: center;
                background-color: white;
                color: black;
            }
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: black;
                    color: white;
                }
            }
            #loading {
                width: 100vw;
                height: 100vh;
                padding: 0;
                margin: 0;
                display: flex;
                align-items: center;
            }
            #root {
                display: flex;
                flex-direction: column;
                width: 100vw;
                height: 100vh;
            }
            #waldiez-root {
                position: relative;
                width: 80vw;
                height: 80vh;
                margin: auto;
            }
        </style>
        <link rel="stylesheet" href="https://esm.sh/@waldiez/react/dist/@waldiez.css">
    </head>
    <body>
        <div id="root"></div>
        <div id="loading">
            Loading...
        </div>
        <script type="module" src="https://esm.sh/tsx"></script>
        <script type="text/babel">
          import { createRoot } from "react-dom/client"
           import { Waldiez } from "@waldiez/react";
           const root = document.getElementById("root");
           document.getElementById("loading").style.display = "none";
           createRoot(root).render(
                <div id="waldiez-root">
                    <Waldiez />
                </div>
            )
        </script>
    </body>
</html>
```

To add the waldiez library to your app:

```shell
npm install @waldiez/react
# or
yarn add @waldiez/react
# or
pnpm add @waldiez/react
# or
bun add @waldiez/react
```

## Usage

### UI Options

- For creating-only (no exporting or running) waldiez flows, you can use the playground at <https://waldiez.github.io>.
- There is also a jupyterlab extension here: [waldiez/jupyter](https://github.com/waldiez/jupyter)
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
waldiez run --file /path/to/a/flow.waldiez --output /path/to/an/output/flow[.py|.ipynb] [--force]
```

### Using docker/podman

### 🪟 Windows (PowerShell with Docker or Podman Desktop)

```powershell
$hostInputFile = "C:\Users\YourName\Documents\flow.waldiez"
$containerInputFile = "/home/waldiez/workspace/flow.waldiez"
$hostOutputDir = "C:\Users\YourName\Documents\waldiez_output"
$containerOutputDir = "/home/waldiez/output"
$containerOutputFile = "/home/waldiez/output/flow.ipynb"

# Convert a flow to Jupyter Notebook
docker run --rm `
  -v "$hostInputFile:$containerInputFile" `
  -v "$hostOutputDir:$containerOutputDir" `
  waldiez/waldiez convert --file $hostInputFile --output $containerOutputFile

# Convert and run it
docker run --rm `
  -v "$flow:/home/waldiez/workspace/flow.waldiez" `
  -v "$output:/output" `
  waldiez/waldiez run --file $hostInputFile --output $containerOutputFile
```

> Note
  If using Hyper-V mode, make sure your files are in a shared folder Docker Desktop has access to.  
  More info: <https://docs.docker.com/desktop/settings/windows/#file-sharing>

### 🐧 Linux/macOS/WSL (Docker or Podman)

```shell
CONTAINER_COMMAND=docker # or podman
# Asuming ./flow.waldiez exists
HOST_INPUT="$(pwd)/flow.waldiez"
CONTAINER_INPUT="/home/waldiez/workspace/flow.waldiez"
HOST_OUTPUT_DIR="$(pwd)/output"
CONTAINER_OUTPUT_DIR="/home/waldiez/output"
mkdir -p ${HOST_OUTPUT_DIR}

# Convert a flow to a Python script
$CONTAINER_COMMAND run --rm \
  -v ${HOST_INPUT}:${CONTAINER_INPUT} \
  -v ${HOST_OUTPUT_DIR}:${CONTAINER_OUTPUT_DIR} \
  waldiez/waldiez convert --file $HOST_INPUT --output ${CONTAINER_OUTPUT_DIR}/flow.py

# Convert to a Jupyter Notebook instead
$CONTAINER_COMMAND run --rm \
  -v ${HOST_INPUT}:${CONTAINER_INPUT} \
  -v ${HOST_OUTPUT_DIR}:${CONTAINER_OUTPUT_DIR} \
  waldiez/waldiez convert --file $HOST_INPUT --output ${CONTAINER_OUTPUT_DIR}/flow.ipynb

# Convert and run it (force override generated file if it exists)
$CONTAINER_COMMAND run --rm -it \
  -v ${HOST_INPUT}:${CONTAINER_INPUT} \
  -v ${HOST_OUTPUT_DIR}:${CONTAINER_OUTPUT_DIR} \
  waldiez/waldiez run --file $HOST_INPUT --force
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

- **autogen-agentchat**: This package conflicts with `ag2`. Ensure that `autogen-agentchat` is uninstalled before installing `waldiez`. If you have already installed `autogen-agentchat`, you can uninstall it with the following command:

  ```shell
  pip uninstall autogen-agentchat -y
  ```

  If already installed waldiez you might need to reinstall it after uninstalling `autogen-agentchat`:

  ```shell
  pip install --force --no-cache waldiez ag2
  ```

## See also

- [Waldiez Playground](https://waldiez.github.io)
- [React Component](https://github.com/waldiez/waldiez/blob/main/README.npm.md)
- [Waldiez Studio](https://github.com/waldiez/studio)
- [Waldiez JupyterLab Extension](https://github.com/waldiez/jupyter)
- [Waldiez VSCode Extension](https://github.com/waldiez/vscode)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://scholar.google.com/citations?user=JmW9DwkAAAAJ"><img src="https://avatars.githubusercontent.com/u/29335277?v=4?s=100" width="100px;" alt="Panagiotis Kasnesis"/><br /><sub><b>Panagiotis Kasnesis</b></sub></a><br /><a href="#projectManagement-ounospanas" title="Project Management">📆</a> <a href="#research-ounospanas" title="Research">🔬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lazToum"><img src="https://avatars.githubusercontent.com/u/4764837?v=4?s=100" width="100px;" alt="Lazaros Toumanidis"/><br /><sub><b>Lazaros Toumanidis</b></sub></a><br /><a href="https://github.com/waldiez/waldiez/commits?author=lazToum" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://humancentered.gr/"><img src="https://avatars.githubusercontent.com/u/3456066?v=4?s=100" width="100px;" alt="Stella Ioannidou"/><br /><sub><b>Stella Ioannidou</b></sub></a><br /><a href="#promotion-siioannidou" title="Promotion">📣</a> <a href="#design-siioannidou" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/amaliacontiero"><img src="https://avatars.githubusercontent.com/u/29499343?v=4?s=100" width="100px;" alt="Amalia Contiero"/><br /><sub><b>Amalia Contiero</b></sub></a><br /><a href="https://github.com/waldiez/vscode/commits?author=amaliacontiero" title="Code">💻</a> <a href="https://github.com/waldiez/vscode/issues?q=author%3Aamaliacontiero" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hchris0"><img src="https://avatars.githubusercontent.com/u/23460824?v=4?s=100" width="100px;" alt="Christos Chatzigeorgiou"/><br /><sub><b>Christos Chatzigeorgiou</b></sub></a><br /><a href="https://github.com/waldiez/runner/commits?author=hchris0" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

This project is licensed under the [Apache License, Version 2.0 (Apache-2.0)](https://github.com/waldiez/waldiez/blob/main/LICENSE).
