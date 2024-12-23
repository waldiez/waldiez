# MyPackage

A short description of the package. Other details can be added below using the relevant sections / headers.

<img fetchpriority="high" alt="Waldiez flow" src="static/images/overview.webp#only-light" />
<img fetchpriority="high" alt="Waldiez flow" src="static/images/overview_dark.webp#only-dark" />

!!! Warning
This is a warning message.
**Required files**

    - `pyproject.toml`  # the project configuration file
    - `scripts/clean.py`  # the script to cleanup unwanted files
    - `scripts/format.py`  # the script to format the code
    - `scripts/lint.py`  # the script to lint the code
    - `scripts/test.py`  # the script to run the tests
        After tests, the script should generate a `coverage/lcov.info` file with the coverage report.

    **Optional files**

    - `scripts/build.py`  # the script to build the package
    - `scripts/publish.py`  # the script to publish the package
    - `scripts/docs.py`  # the script to build the documentation
        If the file exists, it should expect the argument: `--output`.
    - `scripts/image.py`  # the script to build the Podman/Docker image
        It should expect the argument: `--tag`.
        The `--tag` argument should be the image tag.
        The script should build the image and tag it with the provided tag.
        It should also expect the optional argument: `--push`.
        If the `--push` argument is provided, the script should push the image to one or more registries.
