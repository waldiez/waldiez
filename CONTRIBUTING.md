# Contributing to Waldiez Projects

Thank you for your interest in contributing to our projects! This document outlines the guidelines for contributing to Waldiez projects, including how to report issues, submit code changes, and adhere to our code of conduct.

## [Project Specific Guidelines]

The project contains two parts: a Python package (see pyproject.toml) and a TypeScript library (see package.json). The Python package is located in the `waldiez` directory, while the TypeScript library is located in the `src` directory. The TypeScript library is built using [bun](https://bun.sh/), and the Python package is built using [hatch]

### Python

This project is a Python package managed with [uv](https://github.com/astral-sh/uv) and [hatch](https://github.com/pypa/hatch). To get started, clone the repository and install the dependencies:

```bash
git clone ssh://github.com/waldiez/python.git -b dev
cd waldiez
# either use uv or just create a new venv
## create a new venv
# python -m venv .venv
# activate the venv
. .venv/bin/activate
# on windows
# .venv\Scripts\activate.ps1 or .venv\Scripts\activate.bat
# install the dependencies
pip install -r requirements/all.txt
#
## with uv:
## install uv if not already installed
# python -m pip install uv
uv sync
#
```

When ready, you can create a new branch and start working on your changes:

```bash
git checkout -b feature/my-feature
```

Once you are done, you can run the tests and check the code style:

```bash
make format
make lint
make test
```

You can also call:

```bash
./do all
# this will:
# - format the code on the typescript part
# - lint the code on the typescript part
# - run the tests on the typescript part
# - build the typescript library (lib, static, and archive)
# - format the code on the python part
# - lint the code on the python part
# - run the tests on the python part
# - build the python project (whl, sdist)
# - generate the docs
# - create a container image (with the python project)
```

To check both the python and the typescript projects.

### TypeScript

TODO

If everything is fine, you can commit your changes and push them to the repository:

```bash
git add .
git commit -m "feat: my feature"
git push origin feature/my-feature
```

Finally, you can open a pull request on GitHub (use the dev branch as the target branch).

## Code of Conduct

We expect all contributors to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it carefully and ensure that your contributions align with our community values.

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

By submitting code changes, you agree to the terms of our [Contributor License Agreement (CLA)](CLA.md). Please read the CLA carefully before submitting your changes. If you have any questions or concerns about the CLA, please contact us, and we will be happy to assist you.

## Developer Certificate of Origin (DCO)

By contributing to a project owned by Waldiez, you agree to the Developer Certificate of Origin ([DCO](DCO.md)). This document was created by the Linux Kernel community and is a simple statement that you, as a contributor, have the legal right to make the contribution.

## Security Policy

If you discover a security vulnerability in any of our projects, please report it to us immediately. Do not disclose the vulnerability publicly until we have had a chance to address it. For more information, please refer to our [Security Policy](SECURITY.md).

## License

By contributing to Waldiez projects, you agree to the terms of our [License](LICENSE). Please read the license carefully before submitting your contributions. If you have any questions or concerns about the license, please contact us, and we will be happy to assist you.
