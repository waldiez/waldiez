
# 🚀 Getting Started with Waldiez

You can use Waldiez in one of the following ways — pick the one that works best for you:

1. 🌐 **[Use the Playground](#playground)** — no installation required  
2. 🐍 **[Install from PyPI](#pypi-install)** — for full control and customization  
3. 🐳 **[Use Docker](#docker)** — no setup, great for reproducibility  
4. 📦 **[Use the JupyterLab Extension](#jupyterlab)** — for interactive notebooks  
5. 🖥️ **[Use the Visual Studio Code Extension](#vscode)** — for a familiar IDE experience  
6. 🎬 **[Use Waldiez Studio](#studio)** — for a FastAPI-based web UI  


## 🌐 1. Use the Playground (No Installation Required) <a id="playground"></a>

You can visit the Playground at: <https://waldiez.github.io>

You can:

* 🧩 Design and edit Waldiez flows visually
* 🔗 Share flows with others
* ✅ Test layout and logic before running locally

!!! note
    This is great for quick mockups, or early-stage exploration.

!!! warning
    The Playground is read-only:

    - You **cannot run** or **export** flows from the Playground.
    - To convert flows to Python code or run them, use the PyPI or Docker options below.

## 🐍 2. Install from PyPI (Recommended for Full Functionality) <a id="pypi-install"></a>

If you want to create, convert, and run Waldiez flows locally — with full flexibility — install Waldiez using pip.

This option gives you:

* ✅ Full access to the Python API and CLI  
* 🧪 Integration with JupyterLab and Waldiez Studio  
* 🖥️ Local development with VS Code

---

#### 📦 Basic Installation

#### (Optional but highly recommended) Create and activate a virtual environment

```shell
python3 -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
# Upgrade pip (optional)
python -m pip install --upgrade pip
# Install the core Waldiez package
pip install waldiez
```

#### ➕ Optional Extras

Install with extras depending on how you want to work:

```shell
# JupyterLab integration
pip install waldiez[jupyter]  # or pip install waldiez-jupyter

# Waldiez Studio (FastAPI-based web UI)
pip install waldiez[studio]  # or pip install waldiez-studio

# Both
pip install waldiez[studio,jupyter]
```

!!! note
    These extras enable additional commands like `waldiez lab` (for JupyterLab) and `waldiez studio`.

    🧪 Requirements:

    - Python >= 3.10, < 3.13
    - Optional: Docker/Podman if using containers later

## 🐳 3. Use Docker (No Setup Required) <a id="docker"></a>

If you don’t want to install Python or manage dependencies, you can use Waldiez directly from prebuilt container images.

This option gives you:

* ✅ Full functionality without installing anything
* 📦 Easy integration in CI, testing, or isolated dev environments
* 🔁 Reproducible setup across teams

!!! Note
    📦 Available Images:

    - `waldiez/waldiez` — CLI-only: convert and run flows
    - `waldiez/jupyter` — JupyterLab server with Waldiez extension
    - `waldiez/studio` — FastAPI web UI for local flow editing and running
    - `waldiez/runner` - Serve and run waldiez flow in isolated environments

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

!!! Note
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

!!! Note
    📝 Tips:

    * Try using **absolute paths** (or ${PWD}) in all `-v` volume mounts
    * Avoid spaces or special characters in file paths
    * The `.waldiez` file should be a valid flow you’ve created in the Playground or elsewhere
    * If you’re using Linux with Podman and/or SELinux, you might encounter permission errors, so you can try adding the following flags:
    
        **`--userns=keep-id`** and **`--security-opt label=disable`**
        Example:

        ```shell
        podman run \
            --rm \
            -it \
            -v $(pwd)/flow.waldiez:/home/waldiez/workspace/flow.waldiez \
            -v $(pwd)/output:/home/waldiez/output \
            --userns=keep-id \
            --security-opt label=disable \
            waldiez/waldiez convert --file /home/waldiez/workspace --output /home/waldiez/output/flow.py
        ```
    * 💬 If you run into any issues, feel free to open an issue on [Github](https://github.com/waldiez/waldiez/issues). We’re happy to help!

## 📦 4. Use the JupyterLab Extension (for Interactive Notebooks) <a id="jupyterlab"></a>

If you're already working in JupyterLab or prefer a notebook-based environment, you can use the official Waldiez extension.

This gives you:

* 🖥️ A visual flow editor directly inside JupyterLab
* 📤 Export flows to `.py` or `.ipynb`
* ▶️ Run flows from within the notebook environment

#### 🚀 Install with Jupyter support

If you installed Waldiez from PyPI, add the `[jupyter]` extra:

```shell
# Option 1: Fresh install
pip install waldiez[jupyter]

# Option 2: Add it to an existing install
pip install waldiez-jupyter
```

If you’re using the `waldiez/jupyter` Docker image, the Waldiez extension is already preinstalled.
To launch it, run:

```shell
docker run -it -p 8888:8888 -v ${PWD}/notebooks:/home/user/notebooks waldiez/jupyter
```

This will start a JupyterLab server and mount the `notebooks` directory from your host machine to the container.
You can then open your browser at `http://localhost:8888` and start using Waldiez.

![Preview](../static/images/light//setup.webp#only-light)
![Dark Preview](../static/images/dark/setup.webp#only-dark)

#### ▶️ Launch the Waldiez UI inside JupyterLab

Once installed, you can either:

```shell
# Use the CLI to open JupyterLab with the extension:
waldiez lab

# Or just launch JupyterLab normally:
jupyter lab
```

#### ❓ Extension not loading?

Make sure you're running JupyterLab from the **same environment** where Waldiez is installed. If needed, you can reinstall or enable the extension manually:

```shell
jupyter labextension install waldiez
# can also check the currently installed and enabled extensions with:
jupyter labextension list
```

!!! Note
    You can also run Waldiez flows inside notebooks using the Python API:

    ```python
    from waldiez import WaldiezRunner

    # Load your flow from a file
    runner = WaldiezRunner.load("flow.waldiez")

    # Run it and write the output to a script
    runner.run(output_path="output.py")
    ```

## 🖥️ 5. Use the Visual Studio Code Extension (Familiar IDE Experience) <a id="vscode"></a>

If you’re a VS Code user, you can work with Waldiez flows right inside your IDE using the official extension.

This gives you:

* 🧩 A drag-and-drop flow editor inside VS Code
* 📂 Open `.waldiez` files directly
* 💾 Save, edit, and share flows as files
* Convert and run flows if a valid python interpreter exists.

#### 📥 Install the Extension

You can install the extension directly from the VS Code Marketplace:

1. Open the Extensions panel (`Ctrl+Shift+X` or `Cmd+Shift+X` on MacOS)
2. Search for: **`Waldiez`** and install it

Marketplace link:  
🔗 <https://marketplace.visualstudio.com/items?itemName=Waldiez.waldiez-vscode>

Source code repo:  
🔧 <https://github.com/waldiez/vscode>

## 🎬 6. Use Waldiez Studio (FastAPI-based Web UI) <a id="studio"></a>

Waldiez Studio is a lightweight local web application that allows you to:

* 🧩 Create and edit flows using a visual UI
* ▶️ Run flows and see output directly in the browser
* 📤 Export flows to Python or Jupyter formats

---

#### 🚀 Installing Waldiez Studio

If you're using PyPI, install the `[studio]` extra:

```shell
pip install waldiez[studio]
# or
pip install waldiez-studio
```

If you’re using Docker, pull the waldiez/studio image:

```shell
docker pull waldiez/studio
```

#### 🚀 Running Waldiez Studio

You can run Waldiez Studio using the command line:

```shell
waldiez studio --help

# example output (from typer ❤️):

# Usage: waldiez studio [OPTIONS]

# --host                TEXT        The host to run the server on [default: localhost]
# --port                INTEGER     The port to run the server on [default: 8000]
# --reload --no-reload              Reload the server on file changes [default: no-reload]
# --log-level
#                      [CRITICAL|ERROR|WARNING|INFO|DEBUG]  The log level [default: INFO]
# --domain-name         TEXT        [default: localhost]
# --trusted-hosts       TEXT        [default: []]
# --trusted-origins     TEXT        [default: []]]
# --force-ssl --no-force-ssl        Force SSL [default: no-force-ssl]
# --version                         Show the version
# --help -h                         Show this message and exit.

```

A typical usage would be:

```shell
waldiez studio --host 0.0.0.0 --port 8000
```

You can then open your browser and navigate to:
🔗 <http://localhost:8000>

!!! Note
    We are using FastAPI's [TrustedHostMiddleware](https://fastapi.tiangolo.com/advanced/middleware/#trustedhostmiddleware), so make sure you visit the correct URL if you are using a different host or port.
    You can also use the `--trusted-hosts` option to specify a list of trusted hosts.
    For example, if you are running Waldiez Studio on a remote server, you can use:

    ```shell
    waldiez studio --trusted-hosts example.com
    ```

    This will allow you to access waldiez studio from `https://example.com` (assuming that a reverse proxy is set up to forward requests to the correct port and manages SSL).

## 🧪 Advanced Usage

### 🐍 Using the Python API

You can load, convert, and run `.waldiez` flows directly in Python.

#### Export a flow

```python
from waldiez import WaldiezExporter

flow_path = "/path/to/flow.waldiez"
output_path = "/path/to/output.py"  # or .ipynb

exporter = WaldiezExporter.load(flow_path)
exporter.export(output_path)
```

#### Run a flow

```python
from waldiez import WaldiezRunner
from waldiez import WaldiezRunner

flow_path = "/path/to/flow.waldiez"
output_path = "/path/to/output.py"

runner = WaldiezRunner.load(flow_path)
runner.run(output_path=output_path)
```

🧰 Using the Command Line

Waldiez also includes a CLI for converting and running flows:

```shell
# Convert a .waldiez flow to a Python script or Jupyter notebook
waldiez convert --file /path/to/flow.waldiez --output /path/to/output.py

# Convert and run (with optional --force if output exists)
waldiez run --file /path/to/flow.waldiez --output /path/to/output.py --force
```

!!! NOTE
    💡 Use `waldiez --help`, `waldiez convert --help` or `waldiez run --help` to explore more CLI options.

➡️ That's it! Now that you're set up, learn how to use [Waldiez →](./models.md)

[![Docker Pulls](https://img.shields.io/docker/pulls/waldiez/jupyter?cacheSeconds=3600)](https://hub.docker.com/r/waldiez/jupyter)
[![Docker Image Size (tag)](https://img.shields.io/docker/image-size/waldiez/jupyter/latest?cacheSeconds=3600)](https://hub.docker.com/r/waldiez/jupyter)

<!-- Available images:

- [Docker Hub](https://hub.docker.com/r/waldiez/jupyter)
  
- [Quay.io](https://quay.io/repository/waldiez/jupyter)
  
- [GitHub Container Registry](https://ghcr.io/waldiez/jupyter) -->
