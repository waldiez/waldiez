# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: disable=line-too-long
# pyright: reportUnknownMemberType=false
# flake8: noqa: E501
"""Test waldiez.running.gen_seq_diagram.*."""

import json

# noinspection PyUnresolvedReferences
from io import StringIO
from pathlib import Path
from typing import Any

import pandas as pd
import pytest

from waldiez.running.gen_seq_diagram import (
    escape_mermaid_text,
    generate_sequence_diagram,
    get_json_state,
    process_events,
    save_diagram,
)


@pytest.fixture(name="sample_event_dicts")
def sample_event_dicts_fixture() -> list[dict[str, str]]:
    """Fixture to provide a sample events dictionary.

    Returns
    -------
    dict[str, Any]
        Sample events dictionary.
    """
    events = [
        {
            "json_state": json.dumps(
                {
                    "sender": "Alice",
                    "message": {"content": "Hello, Bob! How are you?"},
                }
            ),
            "event_name": "send_func_executed",
            "source_name": "Bob",
        },
        {
            "json_state": json.dumps(
                {
                    "sender": "Bob",
                    "message": {"content": "I'm fine, thanks Alice!"},
                }
            ),
            "event_name": "send_func_executed",
            "source_name": "Alice",
        },
        {
            "json_state": json.dumps(
                {
                    "sender": "Charlie",
                    "message": {
                        "content": 'He said, "This is a tricky case!" with commas.'
                    },
                }
            ),
            "event_name": "send_func_executed",
            "source_name": "Dave",
        },
        {
            "json_state": json.dumps({"sender": "Dave", "message": "{}"}),
            "event_name": "send_func_executed",
            "source_name": "Charlie",
        },
        {
            "json_state": json.dumps(
                {"sender": "Eve", "message": "No content field"}
            ),
            "event_name": "send_func_executed",
            "source_name": "Frank",
        },
        {
            "json_state": json.dumps(
                {"sender": "Alice", "message": {"content": "Reply content"}}
            ),
            "event_name": "reply_func_executed",
            "source_name": "Ignored",
        },
        {
            "json_state": json.dumps(
                {
                    "sender": "Alice",
                    "message": {
                        "content": "Hello, there Bob! How are you? I was thinking about you and wanted to say hi. I hope you are doing well. I am doing well too. I am working on a project and it is going well. I hope to finish it soon. I will let you know when I am done. Take care!"
                    },
                }
            ),
            "event_name": "send_func_executed",
            "source_name": "Bob",
        },
        {
            "json_state": json.dumps(
                {
                    "sender": "Alice",
                    "message": {
                        "content": "Hello,  this is a message with \n new lines and empty space between two lines. \n    \n like this."
                    },
                }
            ),
            "event_name": "send_func_executed",
            "source_name": "Bob",
        },
    ]
    return events


@pytest.fixture(name="sample_events_csv")
def sample_events_csv_fixture(
    sample_event_dicts: list[dict[str, Any]],
) -> StringIO:
    """Fixture to provide a sample CSV input.

    Parameters
    ----------
    sample_event_dicts : list[dict[str, Any]]
        Sample events dictionaries.

    Returns
    -------
    StringIO
        Sample CSV file.
    """
    columns = list(sample_event_dicts[0].keys())
    df = pd.DataFrame(sample_event_dicts, columns=columns)
    csv_file = StringIO()
    df.to_csv(csv_file, index=False)
    csv_file.seek(0)
    return csv_file


def test_get_json_state(sample_event_dicts: list[dict[str, Any]]) -> None:
    """Test get_json_state function.

    Parameters
    ----------
    sample_event_dicts : list[dict[str, Any]]
        Sample event dictionaries.
    """
    invalid_json = '{"invalid": "json", "not : "valid"}'
    assert get_json_state(invalid_json) == {}
    assert get_json_state(sample_event_dicts[0]["json_state"]) == {
        "sender": "Alice",
        "message": {"content": "Hello, Bob! How are you?"},
    }
    assert get_json_state({"json_state": None}) == {"json_state": None}
    assert get_json_state(None) == {}
    assert get_json_state("invalid") == {}


def test_escape_mermaid_text() -> None:
    """Test escape_mermaid_text function."""
    input_text = "Line1\nLine2"
    expected_output = "Line1<br/>Line2"
    assert escape_mermaid_text(input_text) == expected_output
    input_text = "Line1\nLine2\n\n    \nLine3"
    expected_output = "Line1<br/>Line2<br/><br/>    <br/>Line3"
    assert escape_mermaid_text(input_text) == expected_output


def test_process_events(sample_events_csv: StringIO) -> None:
    """Test process_events function with edge cases.

    Parameters
    ----------
    sample_events_csv : StringIO
        Sample CSV file.
    """
    df_events = pd.read_csv(sample_events_csv)

    result = process_events(df_events)

    # Check participants
    assert "participant Alice as Alice" in result
    assert "participant Bob as Bob" in result
    assert "participant Charlie as Charlie" in result
    assert "participant Dave as Dave" in result

    # Check messages
    assert "Content: Hello, Bob! How are you?" in result
    assert "Content: I'm fine, thanks Alice!" in result
    assert 'Content: He said, "This is a tricky case!" with commas.' in result
    assert (
        "Content: Hello, there Bob! How are you? I was thinking about you and wanted to say hi. I hope you ar..."
        in result
    )
    expected = "Hello,  this is a message with <br/> new lines and empty space between two lines. <br/><br/> like t..."
    assert expected in result
    assert "Dave->>Charlie: {}" in result
    assert "Eve->>Frank: No content field" in result
    assert "Content: Reply content" not in result

    # Ensure 'reply_func_executed' is ignored
    assert "reply_func_executed" not in result


def test_save_diagram(tmp_path: Path) -> None:
    """Test save_diagram function.

    Parameters
    ----------
    tmp_path : Path
        Temporary path.
    """
    mermaid_text = "sequenceDiagram\nAlice->>Bob: Hello"
    output_file = tmp_path / "test_save_diagram.mmd"

    save_diagram(mermaid_text, output_file)

    assert output_file.exists()
    with open(output_file, "r", encoding="utf-8") as file:
        assert file.read() == mermaid_text
    output_file.unlink()


def test_generate_sequence_diagram(
    sample_events_csv: StringIO, tmp_path: Path
) -> None:
    """Test generate_sequence_diagram function.

    Parameters
    ----------
    sample_events_csv : StringIO
        Sample CSV file.
    tmp_path : Path
        Temporary path.
    """
    output_file = tmp_path / "test_generate_sequence_diagram.mmd"

    tmp_csv_file = tmp_path / "test_generate_sequence_diagram.csv"
    with open(tmp_csv_file, "w", encoding="utf-8") as file:
        file.write(sample_events_csv.read())
    assert tmp_csv_file.exists()
    generate_sequence_diagram(tmp_csv_file, output_file)
    assert output_file.exists()
    with open(output_file, "r", encoding="utf-8") as file:
        content = file.read()
        assert "sequenceDiagram" in content
        assert "Content: Hello, Bob! How are you?" in content
        assert (
            'Content: He said, "This is a tricky case!" with commas.' in content
        )
    output_file.unlink()


def test_generate_sequence_diagram_with_existing_csv(tmp_path: Path) -> None:
    """Test generate_sequence_diagram function with CSV input.

    Parameters
    ----------
    tmp_path : Path
        Temporary path.
    """
    csv_file = Path(__file__).parent.parent / "data" / "events.csv"
    output_file = tmp_path / "test_generate_sequence_diagram.mmd"
    assert csv_file.exists()
    generate_sequence_diagram(csv_file, output_file)
    assert output_file.exists()
    output_file.unlink()


def test_generate_sequence_diagram_with_json(
    sample_event_dicts: list[dict[str, Any]], tmp_path: Path
) -> None:
    """Test generate_sequence_diagram function with JSON input.

    Parameters
    ----------
    sample_event_dicts : list[dict[str, Any]]
        Sample event dictionaries.
    tmp_path : Path
        Temporary path.
    """
    json_path = tmp_path / "test_generate_sequence_diagram_with_json.json"
    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(sample_event_dicts, file)
    output_file = tmp_path / "test_generate_sequence_diagram_with_json.mmd"
    assert json_path.exists()
    generate_sequence_diagram(json_path, output_file)
    assert output_file.exists()
    output_file.unlink()
    json_path.unlink()


def test_generate_sequence_diagram_failures(tmp_path: Path) -> None:
    """Test generate_sequence_diagram function with invalid inputs.

    Parameters
    ----------
    tmp_path : Path
        Temporary path.
    """
    csv_path = tmp_path / "test_generate_sequence_diagram_failures.csv"
    if csv_path.exists():
        csv_path.unlink(missing_ok=True)
    with pytest.raises(FileNotFoundError):
        generate_sequence_diagram(csv_path, tmp_path / "output.mmd")
    with pytest.raises(ValueError):
        generate_sequence_diagram(__file__, tmp_path / "output.mmd")
