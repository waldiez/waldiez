# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Build container image."""
import argparse
import os
import platform
import shutil
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path
from typing import List

try:
    from dotenv import load_dotenv
except ImportError:
    pass
else:
    load_dotenv(override=False)

os.environ["PYTHONUNBUFFERED"] = "1"
_ROOT_DIR = Path(__file__).parent.parent.resolve()
_DEFAULT_IMAGE = os.environ.get("IMAGE_NAME", "my_repo/my_image")
_FALLBACK_TAG = "dev" if "--dev" in sys.argv else "latest"
_DEFAULT_TAG = os.environ.get("IMAGE_TAG", _FALLBACK_TAG)
_DEFAULT_PLATFORM = os.environ.get("PLATFORM", "linux/amd64")


def cli() -> argparse.ArgumentParser:
    """Create the CLI parser.

    Returns
    -------
    argparse.ArgumentParser
        The CLI parser.
    """
    parser = argparse.ArgumentParser(description="Build container image.")
    parser.add_argument(
        "--image-name",
        type=str,
        default=_DEFAULT_IMAGE,
        help="Name of the image to build.",
    )
    parser.add_argument(
        "--image-tag",
        type=str,
        default=_DEFAULT_TAG,
        help="Tag of the image to build.",
    )
    parser.add_argument(
        "--platform",
        type=str,
        default=_DEFAULT_PLATFORM,
        choices=["linux/amd64", "linux/arm64"],
        help="Set platform if the image is multi-platform.",
    )
    parser.add_argument(
        "--container-command",
        default=get_container_cmd(),
        choices=["docker", "podman"],
        help="The container command to use.",
    )
    parser.add_argument(
        "--build-args",
        type=str,
        action="append",
        help="Build arguments.",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Do not use cache when building the image.",
    )
    parser.add_argument(
        "--push",
        action="store_true",
        help="Push the image.",
    )
    return parser


def get_container_cmd() -> str:
    """Get the container command to use.

    Returns
    -------
    str
        The container command to use. Either "docker" or "podman".

    Raises
    ------
    RuntimeError
        If neither "docker" nor "podman" is found.
    """
    from_env = os.environ.get("CONTAINER_COMMAND", "")
    if from_env and from_env in ["docker", "podman"]:
        return from_env
    # prefer podman over docker if found
    if shutil.which("podman"):
        return "podman"
    if not shutil.which("docker"):
        raise RuntimeError("Could not find docker or podman.")
    return "docker"


def run_command(command: List[str]) -> None:
    """Run a command.

    Parameters
    ----------
    command : List[str]
        The command to run.

    Raises
    ------
    subprocess.CalledProcessError
        If the command returns a non-zero exit status.
    """
    # pylint: disable=inconsistent-quotes
    print(f"Running command: \n{' '.join(command)}\n")
    subprocess.run(
        command,
        check=True,
        env=os.environ,
        cwd=_ROOT_DIR,
        stdout=sys.stdout,
        stderr=subprocess.STDOUT,
    )  # nosemgrep # nosec


def build_image(
    container_file: str,
    image_name: str,
    image_tag: str,
    image_platform: str,
    container_command: str,
    no_cache: bool,
    build_args: List[str],
) -> None:
    """Build the container image.

    Parameters
    ----------
    container_file : str
        The container file to use.
    image_name : str
        Name of the image to build.
    image_tag : str
        Tag of the image to build.
    image_platform : str
        Set platform if the image is multi-platform.
    container_command : str
        The container command to use.
    no_cache : bool
        Do not use cache when building the image.
    build_args : List[str]
        Build arguments.

    Raises
    ------
    subprocess.CalledProcessError
        If the command returns a non-zero exit status.
    """
    cmd = [
        container_command,
        "build",
        "--platform",
        image_platform,
        "--tag",
        f"{image_name}:{image_tag}",
        "-f",
        container_file,
    ]
    if no_cache:
        cmd.append("--no-cache")
    for arg in build_args:
        cmd.extend(["--build-arg", arg])
    if container_command == "docker":
        cmd.extend(["--progress=plain"])
    cmd.append(".")
    run_command(cmd)


# pylint: disable=unused-argument
def push_image(
    image_name: str,
    image_tag: str,
    image_platform: str,
    container_command: str,
) -> None:
    """Push the container image.

    Parameters
    ----------
    image_name : str
        Name of the image to push.
    image_tag : str
        Tag of the image to push.
    image_platform : str
        The platform to push the image to.
    container_command : str
        The container command to use.
    Raises
    ------
    subprocess.CalledProcessError
        If the command returns a non-zero exit status.
    """
    print("Let's say that we:")
    run_command(
        [
            container_command,
            "push",
            "--platform",
            image_platform,
            f"{image_name}:{image_tag}",
        ]
    )
    print(f"Pushed image: {image_name}:{image_tag}")


def setup_qemu_user_static(container_command: str) -> None:
    """Try to setup qemu-user-static for multi-platform builds.

    Parameters
    ----------
    container_command : str
        The container command to use.

    Raises
    ------
    subprocess.CalledProcessError
        If the command returns a non-zero exit status.
    """
    # for multi-platform builds, we need qemu-user-static:
    #
    # docker/podman run \
    #   --rm \
    #   --privileged \
    #   multiarch/qemu-user-static --reset -p yes
    #
    # (and maybe a reboot)
    #
    # with rootless podman, multi-platform builds might not work
    # sudo podman build --arch=... might do, but let's not
    try:
        run_command(
            [
                container_command,
                "run",
                "--rm",
                "--privileged",
                "multiarch/qemu-user-static",
                "--reset",
                "--credential yes",
            ]
        )
    except subprocess.CalledProcessError:
        pass


def check_other_platform(container_command: str, platform_arg: str) -> bool:
    """Check if the image to build is multi-platform.

    Parameters
    ----------
    container_command : str
        The container command to use.
    platform_arg : str
        The platform to build the image for.

    Returns
    -------
    bool
        True if the image to build is multi-platform, False otherwise.
    """
    is_windows = platform.system() == "Windows"
    is_other_platform = is_windows
    if not is_windows:
        my_arch = platform.machine()
        if my_arch == "x86_64":
            my_arch = "amd64"
        elif my_arch in ("aarch64", "arm64"):
            my_arch = "arm64"
        if platform_arg != f"linux/{my_arch}":
            is_other_platform = True
    if is_other_platform:
        setup_qemu_user_static(container_command)
    return is_other_platform


def main() -> None:
    """Parse the CLI arguments and build the container image.

    Raises
    ------
    subprocess.CalledProcessError
        If the command returns a non-zero exit status
    RuntimeError
        If neither "docker" nor "podman" is found.
    BaseException
        If an error occurs.
    """
    args, _ = cli().parse_known_args()
    build_args = args.build_args or []
    container_file = "Containerfile"
    platform_arg = args.platform
    container_command = args.container_command
    allow_error = check_other_platform(container_command, platform_arg)
    try:
        build_image(
            container_file=container_file,
            image_name=args.image_name,
            image_tag=args.image_tag,
            image_platform=platform_arg,
            container_command=container_command,
            no_cache=args.no_cache,
            build_args=build_args,
        )
        if args.push is True:
            push_image(
                image_name=args.image_name,
                image_tag=args.image_tag,
                image_platform=platform_arg,
                container_command=container_command,
            )
    except BaseException as exc:  # pylint: disable=broad-except
        if allow_error:
            print(f"Error: {exc}")
        else:
            raise exc


if __name__ == "__main__":
    main()
