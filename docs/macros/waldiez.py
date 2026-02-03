"""MkDocs macros for Waldiez documentation."""

import requests
from requests.exceptions import RequestException


def define_env(env):
    """Register custom MkDocs macros."""

    @env.macro
    def waldiez_version():
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
