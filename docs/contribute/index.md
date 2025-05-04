# Contributing to Waldiez Projects

Thank you for your interest in contributing to our projects! This document outlines the guidelines for contributing to Waldiez projects, including how to report issues, submit code changes, and adhere to our code of conduct.

## [Project Specific Guidelines]

This project consists of two components:

- A **Python package**, located in the `waldiez` folder, built using [`hatch`](https://hatch.pypa.io/latest/)
- A **TypeScript (React) library and web application**, located in the `src` folder, built using [`bun`](https://bun.sh/)

## 🐍 Contributing to the Python Part (`waldiez/`)

The Python backend is a package managed primarily using [Hatch](https://hatch.pypa.io/latest/), with optional support for [`uv`](https://github.com/astral-sh/uv) and plain `venv`.

---

### 🚀 Quick Setup (Recommended: Hatch)

1. Install Hatch:

```shell
pip install hatch
```

2. Create the dev environment:

```shell
hatch env create
hatch shell
```

3. All optional dependencies are managed via extras (`dev`, `test`, `docs`, etc.), and available via:

```shell
hatch run pip list
```

---

### ⚡ Alternative: Fast Setup with `uv`

1. Install uv:

```shell
pip install uv
```

2. Create and activate an environment:

```shell
uv venv --python 3.12
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
```

3. Install extras:

```shell
uv pip install '.[dev,test,docs]'
```

---

### 🔧 Alternative: Plain Python with `venv` and `requirements/`

This project also supports traditional requirements-based setup:

1. Create a virtualenv:

```shell
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
```

2. Install dependencies:

```shell
pip install -r requirements/all.txt
# or (to avoid all the ag2 extras):
pip install -r requirements/dev.txt
pip install -r requirements/test.txt
pip install -r requirements/docs.txt
```

> If using this method, you won’t have access to Hatch’s `hatch run` commands. Instead, use:
>
> python scripts/lint.py
> python scripts/test.py
> python scripts/format.py
> python scripts/build.py
>

Or you prefer make, you can use `make` commands:

```shell
Usage: make [target]

Default target: help

Targets:
 help             Show this message and exit
 requirements     Generate requirements/*.txt files
 format           Run the formatters for the python package
 lint             Run the linters for the python package
 forlint          Alias for 'format' and 'lint'
 clean            Cleanup unneeded files
 test             Run the tests for the python package
 test-models      Run the tests for the models
 test-exporting   Run the tests for exporting
 test-running     Run the tests for running
 test-io          Run the tests for the IO stream
 build            Build the python package
 docs             Generate the python documentation
 docs-live        Generate the documentation in 'live' mode
 images           Build the podman/docker images
 some             Run some (not all) of the above
```

---

### 🧪 Testing (Py)

To run all tests with full coverage reports:

```shell
hatch run test
```

To run only selected test modules:

```shell
hatch run test-models
hatch run test-exporting
hatch run test-io
```

To test against multiple Python versions (3.10–3.13):

```shell
hatch run matrix-test
```

---

### 🧹 Formatting & Linting (Py)

To auto-format everything:

```shell
hatch run format
```

To run all linters:

```shell
hatch run lint
```

This runs: `black`, `ruff`, `mypy`, `flake8`, `bandit`, `pylint`, `yamllint`

---

### 📦 Build & Release

To generate build artifacts:

```shell
hatch run build
```

To generate documentation:

```shell
hatch run docs
```

To run all checks + matrix tests + docs + build:

```shell
hatch run all
```

---

## ⚛️ Contributing to the React Part (`src/`)

The React frontend is a TypeScript project built with [Bun](https://bun.sh/), and [Vite](https://vitejs.dev/). It includes integrated support for Monaco editor, Playwright browser testing, Vitest, and full lint/style/format scripts.

---

### 🧰 Prerequisites

- Node.js 22.x or later
- Bun v1.2.10 or later

---

### 🚀 Setup

1. Clone the repository if not already done:

```shell
git clone https://github.com/waldiez/waldiez.git -b dev
cd waldiez
```

2. Install the dependencies:

```shell
bun install
```

---

### 🧪 Development

Start the dev server:

```shell
bun dev
```

This runs `bun monaco && vite` and launches the app at:

```shell
http://localhost:5173
```

---

### 🧹 Formatting & Linting (React)

To check and fix code style:

```shell
bun format
```

This runs:

- `prettier`
- `stylelint`
- `eslint --fix`

To check only (no changes):

```shell
bun lint
```

Or do both:

```shell
bun forlint
```

---

### 🧪 Testing (React)

Run all tests (components + browser):

```shell
bun test
```

Run just unit/component tests:

```shell
bun test:components
```

Run browser tests (Playwright required):

```shell
bun test:browser
```

Update UI snapshots:

```shell
bun test:snapshots
```

Run tests with coverage:

```shell
bun test:coverage
```

---

### 📦 Build (React)

Full build pipeline (library + web app + archive):

```shell
bun run build
```

Build documentation:

```shell
bun docs
```

Preview build output:

```shell
bun preview
```

---

### 🔧 Cleaning

Clean all outputs (builds, coverage, tsbuildinfo, etc.):

```shell
bun clean
```

You can also run partial cleaning scripts:

- `bun clean:lintcache`
- `bun clean:dist`
- `bun clean:coverage`
- `bun clean:web`
- `bun clean:docs`
- `bun clean:archive`

---

### 🔗 Combined Project Pipeline

You can run the full project build pipeline (React + Python) using the unified helper:

```shell
./do all
```

This will:

- Format, lint, and test the React project
- Build the React frontend and archive
- Format, lint, and test the Python package
- Build the Python wheel/sdist
- Build documentation
- Build a Docker image with the python package

---

### ✅ Submitting Changes

1. Ensure lint and tests pass:

```shell
# either on the react part:
bun format
bun lint
bun test
bun schema
# or on the python part:
hatch run format
hatch run lint
hatch run test
# or the make/python way:
make forlint
make test
```

2. Optionally (but recommended) ensure everything (Python + React) is working:

```shell
# or ./scripts/do.{sh,ps1} all
./do all
```

3. Commit and push:

```shell
git commit -m "feat: my feature"
git push origin feature/my-feature
```

4. Open a pull request targeting the `dev` branch.

---

> 💡 Tip: All low-level commands are also available in `scripts/`, such as:
>
> - `scripts/do.sh`
> - `scripts/do.ps1`
> - `scripts/monaco.ts`
> - `scripts/changelog.ts`
> - `scripts/mkdir.ts`
> - `scripts/pack.ts`
> - `scripts/schema.ts`
> - `scripts/image.py`
> - `scripts/format.py`
> - `scripts/lint.py`
> - `scripts/test.py`
> - `scripts/build.py`

## Code of Conduct

We expect all contributors to adhere to our [Code of Conduct](https://github.com/waldiez/waldiez/blob/main/CODE_OF_CONDUCT.md). Please read it carefully and ensure that your contributions align with our community values.

## Reporting Issues

If you encounter any issues while using our projects, please report them to the relevant Project's issue tracker. When reporting an issue, please provide as much detail as possible, including:

- A clear and descriptive title for the issue
- A detailed description of the problem
- Steps to reproduce the issue
- Any relevant screenshots or error messages
- Your environment details (e.g., operating system, version, etc.)
- Any other information that may help us understand the issue

## Submitting Code Changes

If you would like to contribute code changes, please follow these steps:

1. Fork the repository (prefer the dev branch if available) and create a new branch for your changes.
2. Work on your changes in the new branch. Ensure that your code adheres to our coding standards and best practices.
3. Run tests to ensure that your changes do not introduce any new issues.
4. Submit a pull request to the dev (or main a dev is not available) branch of the original repository.
5. Include a description of your changes and reference any related issues in the pull request.
6. Ensure that your pull request passes all checks and adheres to our contribution guidelines.
7. Be responsive to feedback and make any necessary changes to your pull request.
8. Once your pull request is approved, it will be merged into the main branch.
9. Celebrate your contribution to the Waldiez community!

## Contributor License Agreement (CLA)

By submitting code changes, you agree to the terms of our [Contributor License Agreement (CLA)](https://github.com/waldiez/waldiez/blob/main//governance/CLA.md). Please read the CLA carefully before submitting your changes. If you have any questions or concerns about the CLA, please contact us, and we will be happy to assist you.

## Developer Certificate of Origin (DCO)

By contributing to a project owned by Waldiez, you agree to the Developer Certificate of Origin ([DCO](https://github.com/waldiez/waldiez/blob/main/governance/DCO.md)). This document was created by the Linux Kernel community and is a simple statement that you, as a contributor, have the legal right to make the contribution.

## Security Policy

If you discover a security vulnerability in any of our projects, please report it to us immediately. Do not disclose the vulnerability publicly until we have had a chance to address it. For more information, please refer to our [Security Policy](https://github.com/waldiez/waldiez/blob/main/SECURITY.md).

## License

By contributing to Waldiez projects, you agree to the terms of our [License](https://github.com/waldiez/waldiez/blob/main/LICENSE). Please read the license carefully before submitting your contributions. If you have any questions or concerns about the license, please contact us, and we will be happy to assist you.
