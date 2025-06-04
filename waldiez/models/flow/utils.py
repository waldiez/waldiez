# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Helpers for the flow model."""

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, TypedDict

from ..agents import (
    WaldiezAgent,
)
from ..chat import WaldiezChat


def read_version() -> str:  # pragma: no cover  # depends on file existence
    """Read the version from the version file.

    Returns
    -------
    str
        The version.
    """
    here = Path(__file__).parent
    package_dir = here.parent.parent
    version_file = package_dir / "_version.py"
    if not version_file.exists():
        return "0.0.0"  # dev / ignored
    with version_file.open() as f:
        for line in f:
            if line.startswith("__version__"):
                version = line.split("=")[1].strip().strip('"').strip("'")
                # send version without "v" prefix
                if version.startswith("v"):
                    version = version[1:]
                # make sure it is a valid semver
                if not version or not all(
                    part.isdigit() for part in version.split(".")
                ):
                    return "0.0.0"
                return version
    return "0.0.0"  # fallback if not found


def id_factory() -> str:
    """Generate a unique ID.

    Returns
    -------
    str
        The unique ID.
    """
    now_td = datetime.now(timezone.utc)
    now_str = now_td.strftime("%Y%m%d%H%M%S%f")
    return f"{now_str}-{uuid.uuid4().hex}"


def get_flow_data(
    data: dict[str, Any],
    flow_id: Optional[str] = None,
    name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[list[str]] = None,
    requirements: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Get the flow from the passed data dict.

    Parameters
    ----------
    data : dict[str, Any]
        The data dict.
    flow_id : Optional[str], optional
        The flow ID, by default None.
    name : Optional[str], optional
        The flow name, by default None.
    description : Optional[str], optional
        The flow description, by default None.
    tags : Optional[list[str]], optional
        The flow tags, by default None.
    requirements : Optional[list[str]], optional
        The flow requirements, by default None.

    Returns
    -------
    dict[str, Any]
        The flow data.

    Raises
    ------
    ValueError
        If the flow type is not "flow".
    """
    item_type = data.get("type", "flow")
    if item_type != "flow":
        # empty flow (from exported model/tool ?)
        raise ValueError(f"Invalid flow type: {item_type}")
    from_args: dict[str, Any] = {
        "id": flow_id,
        "name": name,
        "description": description,
        "tags": tags,
        "requirements": requirements,
    }
    for key, value in from_args.items():
        if value:
            data[key] = value
    if "name" not in data:
        data["name"] = "Waldiez Flow"
    if "description" not in data:
        data["description"] = "Waldiez Flow description"
    if "tags" not in data:
        data["tags"] = []
    if "requirements" not in data:
        data["requirements"] = []
    return data


class WaldiezAgentConnection(TypedDict):
    """Agent connection."""

    source: WaldiezAgent
    target: WaldiezAgent
    chat: WaldiezChat
