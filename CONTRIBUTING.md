# How to contribute to this project

Thank you for your interest in contributing! This repository manages formatting, linting, testing, and releases for its submodules. You can choose to work on this core repository or directly on one of the submodules, depending on your focus.

## Getting Started

This repository manages formatting, linting, testing, and releases for its submodules. You can choose to work on this core repository or directly on one of the submodules, depending on your focus.

## Working with the Core Repository

The core repository ensures:

    Consistent formatting and linting for all submodules.
    Running tests across the core and all submodules.
    Handling releases for the submodules.

To Contribute via the Core Repository:

    Clone the repository (with submodules):

```shell
git clone --recurse-submodules git@github.com:waldiez/waldiez.git
# or if (not using SSH)
# git clone --recurse-submodules https://github.com/waldiez/waldiez.git
```

    Make your changes in the core repository.
    Push your changes to your fork.
    Create a pull request.

## Working with a Submodule

You can also contribute directly to a submodule. All submodules can be managed independently (no workspaces are required). So, you can directly clone the submodule you want to work on. Please follow any specific instructions in the submodule's README and/or CONTRIBUTING.md.

Once a submodule's default/main branch is updated, you can create a pull request to the core repository to update the submodule reference. The submodules on this project are:

- [packages/core/python](https://github.com/waldiez/python) is the core python package to convert and run waldiez flows.
- [packages/core/react](https://github.com/waldiez/react) is the core react package to create and visualize waldiez flows.
- [packages/jupyter](https://github.com/waldiez/jupyter) is a jupyter extension that combines the core python and react packages.
- [packages/vscode](https://github.com/waldiez/vscode) is a vscode extension that combines the core python and react packages.
- [packages/studio](https://github.com/waldiez/studio) is a web app that combines the core python and react packages.
- [examples](https://github.com/waldiez/examples) is a collection of exported waldiez flows.

## Reporting Issues

If you encounter any issues, please report them in the core repository's issue tracker. If the issue is specific to a submodule, please mention it in the issue description.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Developer Certificate of Origin

By contributing to this project, you agree to the Developer Certificate of Origin (DCO). This document was created by the Linux Kernel community and is a simple statement that you, as a contributor, have the legal right to make the contribution. From <http://developercertificate.org/>:

```markdown
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.


Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```
