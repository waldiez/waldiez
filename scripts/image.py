# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportConstantRedefinition=false
# pylint: disable=invalid-name

"""Build the container image."""

import argparse
import os
import platform
import shutil
import subprocess  # nosemgrep # nosec
import sys
from pathlib import Path

try:
    # noinspection PyUnresolvedReferences
    from dotenv import load_dotenv
except ImportError:
    pass
else:
    load_dotenv(override=False)

os.environ["PYTHONUNBUFFERED"] = "1"
_MY_ARCH = platform.machine().lower()
if _MY_ARCH == "x86_64":
    _MY_ARCH = "amd64"
elif _MY_ARCH in ("aarch64", "arm64"):
    _MY_ARCH = "arm64"
_ROOT_DIR = Path(__file__).parent.parent.resolve()
_DEFAULT_IMAGE = os.environ.get("IMAGE_NAME", "waldiez/waldiez")
_FALLBACK_TAG = "dev" if "--dev" in sys.argv else "latest"
_DEFAULT_TAG = os.environ.get("IMAGE_TAG", _FALLBACK_TAG)
_DEFAULT_PLATFORM = os.environ.get("PLATFORM", f"linux/{_MY_ARCH}")


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


def is_podman_running() -> bool:
    """Check if Podman is running.

    Returns
    -------
    bool
        True if Podman is running, False otherwise.
    """
    try:
        subprocess.run(  # nosemgrep # nosec
            ["podman", "ps"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return False
    return True


def is_docker_running() -> bool:
    """Check if Docker is running.

    Returns
    -------
    bool
        True if Docker is running, False otherwise.
    """
    try:
        subprocess.run(  # nosemgrep # nosec
            ["docker", "ps"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return False
    return True


def get_container_cmd() -> str:
    """Get the container command to use.

    Returns
    -------
    str
        The container command to use. Either "docker" or "podman".
    """
    from_env = os.environ.get("CONTAINER_COMMAND", "")
    if from_env and from_env in ["docker", "podman"]:
        return from_env
    # prefer podman over docker if found
    if shutil.which("podman") and is_podman_running():
        return "podman"
    if not shutil.which("docker") or not is_docker_running():
        # let's just exit (skip creating image)
        # if no running container engine is found
        sys.exit(0)
    return "docker"


def run_command(command: list[str]) -> None:
    """Run a command.

    Parameters
    ----------
    command : list[str]
        The command to run.

    Raises
    ------
    subprocess.CalledProcessError
        If the command returns a non-zero exit status.
    """
    # pylint: disable=inconsistent-quotes
    command_string = " ".join(command)
    print("Running command: \n" + command_string + "\n")
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
    build_args: list[str],
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
    build_args : list[str]
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
    platform_arg_arch = platform_arg.split("/")[1]
    if not is_windows:
        is_other_platform = platform_arg_arch != _MY_ARCH
    # pylint: disable=line-too-long
    # for multi-platform builds:
    # docker/podman run --rm --privileged tonistiigi/binfmt --install all # noqa: E501
    # (and maybe a reboot)?
    #
    # with rootless podman, multi-platform builds might not work
    # sudo podman build --arch=... might do, but let's not
    if is_other_platform:
        # pylint: disable=broad-exception-caught
        # noinspection PyBroadException
        try:
            run_command(
                [
                    container_command,
                    "run",
                    "--rm",
                    "--privileged",
                    "tonistiigi/binfmt",
                    "--install",
                    "all",
                ]
            )
        except BaseException:
            pass
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
    build_args: list[str] = args.build_args or []
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
    except BaseException as exc:  # pylint: disable=broad-exception-caught
        if allow_error:
            print(f"Error: {exc}")
        else:
            raise exc


if __name__ == "__main__":
    main()
