# import newest release version from GitHub API
import requests


def define_env(env):
    @env.macro
    def waldiez_version():
        try:
            r = requests.get(
                "https://api.github.com/repos/waldiez/waldiez/releases/latest",
                timeout=5,
            )
            r.raise_for_status()
            return r.json()["tag_name"]
        except Exception:
            return "latest"