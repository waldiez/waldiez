# Contributing to Waldiez Projects

Thank you for your interest in contributing to the Waldiez repositories! Below, you’ll find the guidelines for contributing code, documentation, and ideas to our various projects. We welcome contributions of all types, including new features, bug fixes, and documentation improvements.

## 1. Getting Started

- **Fork the Repository**: Fork the repository you want to contribute to by clicking the "Fork" button on GitHub.
- **Clone Your Fork**: Clone the forked repository to your local machine.
    <!--markdownlint-disable MD034-->

   `git clone https://github.com/YOU/REPOSITORY-NAME.git`

- **Set Upstream**: Add the original repository as a remote upstream.

   `git remote add upstream https://github.com/waldiez/REPOSITORY-NAME.git`

- **Check for Requirements**: Some projects may have specific dependencies or setup instructions listed in a `README` or `CONTRIBUTING.md` file within the repository.

## 2. Contribution Guidelines

Before making any changes, please read through our organization-wide contribution guidelines:

- **Open an Issue First**: For larger changes, open an issue to discuss your proposed changes with the maintainers. This helps avoid duplicate work and ensures alignment with project goals.
- **Follow the Code of Conduct**: Review and adhere to our [Code of Conduct](../CODE_OF_CONDUCT.md).
- **Respect Repository Owners**: Each repository may have its own set of maintainers or reviewers. Follow their guidelines for submitting work and await feedback before merging.

## 3. Submitting Issues

If you notice a bug or have a feature request:

- **Check Existing Issues**: Before creating a new issue, search the issues in the repository to avoid duplicates.
- **Open a New Issue**: Use a descriptive title and include any necessary details (e.g., steps to reproduce for bugs).
- **Add Labels**: If possible, label your issue as a `bug`, `enhancement`, `documentation`, or `question`.
- **Follow the Issue Template** (if available): Some repositories may have specific templates for bug reports, feature requests, etc.

### 4. Working on Issues

If you want to work on an existing issue:

- **Check for an Assignee**: If no one is assigned, comment on the issue and ask to be assigned.
- **Claim the Issue**: Wait for a maintainer to assign the issue to you to avoid duplicate work.
- **Create a New Branch**: Use a descriptive name for your branch.

    git checkout -b feature/your-feature-name

## 5. Submitting Pull Requests

When you’re ready to submit your changes:

- **Sync with Upstream**: Pull the latest changes from the upstream repository and resolve any conflicts.

    git fetch upstream
    git merge upstream/main

- **Create a Pull Request**: Push your branch to your fork and open a pull request (PR) to the original repository.

- **Write a Descriptive Title and Message**: Briefly describe your changes and the issue it addresses.

- **Link the Related Issue**: Use keywords like `Closes #ISSUE_NUMBER` to link to the relevant issue.

- **Await Review**: A maintainer will review your PR. Be ready to make changes based on feedback.

## 6. Code Style & Best Practices

To maintain code consistency:

- **Follow Project Coding Standards**: Refer to any coding guidelines or `.editorconfig` /`eslint` / `flake8` / `pyproject.toml` files in the repository.
- **Write Tests**: Ensure new features or fixes are covered by tests, where applicable.
- **Add Documentation**: If your changes require updates to the documentation, make those in the appropriate files.

## 7. Project-Specific Instructions

Some repositories may have additional instructions:

- **[waldiez/waldiez](https://github.com/waldiez/waldiez)**: The core python and react parts of the project. Responsible for generating waldiez flows, converting them to python scripts and jupyter notebooks, as well as running them.
- **[waldiez/jupyter](https://github.com/waldiez/jupyter)**: It combines the python and react parts above. It is responsible for running the python scripts and jupyter notebooks created by the user.
- **[waldiez/studio](https://github.com/waldiez/studio)**: A standalone (without jupyter) web app that also combines the python and react parts above. Once ready, it will be included as an extra requirement in the waldiez pypi package.
- **[waldiez/vscode](https://github.com/waldiez/vscode)**: A waldiez vscode extension: Open .waldiez files in vscode convert them to python scripts and jupyter notebooks, and run them.
- **[waldiez/runner](https://github.com/waldiez/runner)**: Responsible for queuing and running waldiez flows in isolated environments and stream logs/input/output via Redis.

Refer to the `README.md` or `CONTRIBUTING.md` of each repository for detailed information.

## 8. Resources

- [Git and GitHub Guide](https://guides.github.com/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

We appreciate your contributions! 🎉
