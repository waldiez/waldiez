# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Build podman/docker images.

In sub-projects that have either a
scripts/image.py or scripts/image.ts file.
"""

import sys
from pathlib import Path

HAD_TO_MODIFY_SYS_PATH = False
DEFAULT_TAG = "latest"
SKIP_ARM = True

try:
    from _lib import get_py_image_configs, run_command
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from _lib import get_py_image_configs, run_command  # type: ignore

    HAD_TO_MODIFY_SYS_PATH = True


def build_image(
    image_dir: Path,
    name: str,
    platform: str,
    tag: str = DEFAULT_TAG,
    push: bool = False,
) -> None:
    """Build the podman/docker image.

    Parameters
    ----------
    image_dir : Path
        The image directory.
    name : str
        The image name.
    platform : str
        The image platform.
    tag : str, optional
        The image tag, by default DEFAULT_TAG
    push : bool, optional
        Whether to push the image, by default False
    """
    image_script = image_dir / "scripts" / "image.py"
    if not image_script.exists():
        print(f"Image script not found in {image_dir}, skipping ...")
        return
    print(f"Building image in {image_dir} ...")
    args = [
        str(image_script),
        "--image-name",
        name,
        "--image-tag",
        tag,
        "--platform",
        platform,
    ]
    if push:
        args.append("--push")
    executable = [sys.executable]
    run_command(executable + args, cwd=image_dir)


def main() -> None:
    """Build the podman/docker images."""
    push = False
    if "--push" in sys.argv:
        push = True
    for config in get_py_image_configs():
        for platform in config.platforms:
            if SKIP_ARM and "arm" in platform:
                continue
            build_image(
                Path(config.file).parent,
                name=f"waldiez/{config.name}",
                platform=platform,
                push=push,
            )


if __name__ == "__main__":
    try:
        main()
    finally:
        if HAD_TO_MODIFY_SYS_PATH:
            sys.path.pop(0)
