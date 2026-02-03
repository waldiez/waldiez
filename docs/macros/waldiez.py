"""MkDocs macros for Waldiez documentation."""

# pylint: skip-file

from typing import Any

import requests
from requests.exceptions import RequestException


def define_env(env: Any) -> None:
    """Register custom MkDocs macros."""

    @env.macro  # type: ignore[untyped-decorator]
    def waldiez_version() -> str:
        """Return the latest Waldiez release version from GitHub."""
        try:
            response = requests.get(
                "https://api.github.com/repos/waldiez/waldiez/releases/latest",
                timeout=5,
            )
            response.raise_for_status()
            return response.json().get("tag_name", "latest")
        except RequestException:
            return "latest"
