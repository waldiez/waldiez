# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test WaldiezExporter."""

import json
import uuid
from pathlib import Path
from typing import Any

import pytest

from waldiez import Waldiez
from waldiez.exporter import REDACTED, WaldiezExporter, _replace_secrets
from waldiez.models import WaldiezFlow

from .exporting.flow_helpers import get_flow


def test_export_load_from_file(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporting and loading from file.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    exporter.export(str(output_file))
    assert output_file.exists()
    WaldiezExporter.load(output_file)
    output_file.unlink(missing_ok=True)


def test_exporter_load_invalid_path() -> None:
    """Test exporter load invalid path."""
    with pytest.raises(ValueError):
        WaldiezExporter.load(Path("non_existent_file"))


def test_exporter_use_directory(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporter use directory.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_dir = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    output_dir.mkdir()
    with pytest.raises(IsADirectoryError):
        exporter.export(output_dir)
    output_dir.rmdir()


def test_exporter_file_exists(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporter file exists.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    output_file.touch()
    with pytest.raises(FileExistsError):
        exporter.export(output_file)
    exporter.export(output_file, force=True)
    output_file.unlink(missing_ok=True)


def test_exporter_force(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporter force.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    output_file.touch()
    exporter.export(output_file, force=True)
    output_file.unlink(missing_ok=True)


def test_export_to_py(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporting to Python.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.py"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_export_to_ipynb(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporting to Jupyter Notebook.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.ipynb"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_export_to_waldiez(tmp_path: Path, waldiez_flow: WaldiezFlow) -> None:
    """Test exporting to Waldiez file.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink(missing_ok=True)


def test_export_to_invalid_extension(
    tmp_path: Path, waldiez_flow: WaldiezFlow
) -> None:
    """Test exporting to invalid extension.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    waldiez_flow : WaldiezFlow
        A WaldiezFlow instance.
    """
    waldiez = Waldiez(flow=waldiez_flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.invalid"
    with pytest.raises(ValueError):
        exporter.export(output_file)


def test_export_complex_flow(tmp_path: Path) -> None:
    """Test exporting invalid flow.

    Parameters
    ----------
    tmp_path : Path
        A pytest fixture to provide a temporary directory.
    """
    flow = get_flow()
    waldiez = Waldiez(flow=flow)
    exporter = WaldiezExporter(waldiez)
    output_file = tmp_path / f"{uuid.uuid4().hex}.py"
    exporter.export(output_file)
    assert output_file.exists()
    output_file.unlink()


def _make_flow_with_secrets() -> WaldiezFlow:
    flow_dict: dict[str, Any] = {
        "id": uuid.uuid4().hex,
        "type": "flow",
        "version": "0.7.1",
        "storageId": uuid.uuid4().hex,
        "name": "test",
        "description": "test",
        "tags": [],
        "requirements": [],
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "data": {
            "nodes": [],
            "edges": [],
            "viewport": {},
            "agents": {
                "groupManagerAgents": [],
                "userProxyAgents": [],
                "assistantAgents": [
                    {
                        "id": "a1",
                        "type": "agent",
                        "agentType": "assistant",
                        "name": "a",
                        "description": "",
                        "tags": [],
                        "requirements": [],
                        "createdAt": "2025-01-01T00:00:00.000Z",
                        "updatedAt": "2025-01-01T00:00:00.000Z",
                        "data": {
                            "systemMessage": None,
                            "humanInputMode": "NEVER",
                            "codeExecutionConfig": False,
                            "agentDefaultAutoReply": None,
                            "maxConsecutiveAutoReply": None,
                            "modelIds": [],
                            "tools": [],
                            "parentId": None,
                            "nestedChats": [],
                            "contextVariables": {
                                # pylint: disable=line-too-long
                                "token": "SHOULD_BE_REDACTED",  # nosemgrep # nosec # noqa: E501
                            },
                            "updateAgentStateBeforeReply": [],
                            "afterWork": None,
                            "handoffs": [],
                            "isMultimodal": False,
                        },
                    }
                ],
                "ragUserProxyAgents": [],
                "reasoningAgents": [],
                "captainAgents": [],
                "docAgents": [],
            },
            "models": [
                {
                    "id": "m1",
                    "type": "model",
                    "name": "gpt-x",
                    "description": "",
                    "tags": [],
                    "requirements": [],
                    "createdAt": "2025-01-01T00:00:00.000Z",
                    "updatedAt": "2025-01-01T00:00:00.000Z",
                    "data": {
                        "apiKey": "SUPER_SECRET",
                        "apiType": "openai",
                        "apiVersion": None,
                        "baseUrl": None,
                        "temperature": None,
                        "topP": None,
                        "maxTokens": None,
                        "aws": {
                            "region": "eu-west-1",
                            "accessKey": "AK_IA...",
                            "secretKey": "SECRET...",
                            "sessionToken": "SESSION...",
                            "profileName": "default",
                        },
                        "extras": {},
                        "defaultHeaders": {
                            "Authorization": "Bearer SECRET_BEARER",
                            "X-Api-Key": "SECRET_HEADER_KEY",
                        },
                        "price": {
                            "promptPricePer1k": None,
                            "completionTokenPricePer1k": None,
                        },
                    },
                }
            ],
            "tools": [
                {
                    "id": "t1",
                    "type": "tool",
                    "name": "tool",
                    "description": "",
                    "tags": [],
                    "requirements": [],
                    "createdAt": "2025-01-01T00:00:00.000Z",
                    "updatedAt": "2025-01-01T00:00:00.000Z",
                    "data": {
                        "content": "def tool():\n    print('hi')",
                        "toolType": "custom",
                        "secrets": {"OPENAI_API_KEY": "ALSO_SECRET"},
                        "kwargs": {},
                    },
                }
            ],
            "chats": [],
            "isAsync": False,
            "cacheSeed": None,
            "silent": False,
        },
    }
    # If WaldiezFlow is a pydantic model, this should work:
    return WaldiezFlow.model_validate(flow_dict)


def test_export_to_waldiez_skip_secrets_false_keeps_values(
    tmp_path: Path,
) -> None:
    """Test exporting to waldiez without skipping secrets, keeps the values.

    Parameters
    ----------
    tmp_path : Path
        Tmp path.
    """
    flow = _make_flow_with_secrets()
    waldiez = Waldiez(flow=flow)
    exporter = WaldiezExporter(waldiez)

    out = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    exporter.export(out, skip_secrets=False)

    raw = out.read_text(encoding="utf-8")
    parsed = json.loads(raw)

    assert parsed["data"]["models"][0]["data"]["apiKey"] == "SUPER_SECRET"
    assert (
        parsed["data"]["models"][0]["data"]["aws"]["secretKey"] == "SECRET..."
    )
    assert (
        parsed["data"]["models"][0]["data"]["defaultHeaders"]["Authorization"]
        == "Bearer SECRET_BEARER"
    )
    assert (
        parsed["data"]["tools"][0]["data"]["secrets"]["OPENAI_API_KEY"]
        == "ALSO_SECRET"
    )


def test_export_to_waldiez_skip_secrets_true_redacts_known_locations(
    tmp_path: Path,
) -> None:
    """Test exporting to waldiez with skipping secrets, redacts values.

    Parameters
    ----------
    tmp_path : Path
        Tmp path.
    """
    flow = _make_flow_with_secrets()
    waldiez = Waldiez(flow=flow)
    exporter = WaldiezExporter(waldiez)

    out = tmp_path / f"{uuid.uuid4().hex}.waldiez"
    exporter.export(out, skip_secrets=True)

    parsed = json.loads(out.read_text(encoding="utf-8"))

    mdata = parsed["data"]["models"][0]["data"]
    assert mdata["apiKey"] == REDACTED

    aws = mdata["aws"]
    assert aws["accessKey"] == REDACTED
    assert aws["secretKey"] == REDACTED
    assert aws["sessionToken"] == REDACTED
    # depending on your choice:
    assert aws["region"] == REDACTED
    assert aws["profileName"] == REDACTED

    headers = mdata["defaultHeaders"]
    assert headers["Authorization"] == REDACTED
    assert headers["X-Api-Key"] == REDACTED

    secrets = parsed["data"]["tools"][0]["data"]["secrets"]
    assert secrets["OPENAI_API_KEY"] == REDACTED


def test_replace_secrets_deep_redacts_suspicious_keys_everywhere() -> None:
    """Test deep scanning, redacts secrets everywhere."""
    flow = _make_flow_with_secrets()
    dump = flow.model_dump_json(indent=2)

    parsed: dict[str, Any] = json.loads(dump)
    termination: dict[str, Any] = {
        "type": "none",
        "keywords": [],
        "criterion": None,
        "methodContent": None,
    }
    parsed["data"]["agents"]["assistantAgents"] = [
        {
            "id": "a1",
            "type": "agent",
            "agentType": "assistant",
            "name": "a",
            "description": "",
            "tags": [],
            "requirements": [],
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z",
            "data": {
                "systemMessage": None,
                "humanInputMode": "NEVER",
                "codeExecutionConfig": False,
                "agentDefaultAutoReply": None,
                "maxConsecutiveAutoReply": None,
                "termination": termination,
                "modelIds": [],
                "tools": [],
                "parentId": None,
                "nestedChats": [],
                "contextVariables": {
                    "token": "SHOULD_BE_REDACTED",  # nosemgrep # nosec
                },
                "updateAgentStateBeforeReply": [],
                "afterWork": None,
                "handoffs": [],
                "isMultimodal": False,
            },
        }
    ]

    redacted = _replace_secrets(json.dumps(parsed), deep=True)
    red_parsed = json.loads(redacted)

    assert (
        red_parsed["data"]["agents"]["assistantAgents"][0]["data"][
            "contextVariables"
        ]["token"]
        == REDACTED
    )
