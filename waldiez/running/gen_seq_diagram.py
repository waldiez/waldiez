# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

# pyright: reportUnknownArgumentType=false,reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
"""Generate a Mermaid sequence diagram from a file containing event data."""

import json
import re
from pathlib import Path
from typing import Any

import pandas as pd

MAX_LEN = 100
SEQ_TXT = """
%%{init: {'sequence': {'actorSpacing': 10, 'width': 150}}}%%
sequenceDiagram
"""


def escape_mermaid_text(text: str) -> str:
    """Replace newline characters with <br/> for Mermaid compatibility.

    Parameters
    ----------
    text : str
        The text to escape.

    Returns
    -------
    str
        The escaped text with newline characters replaced by <br/>.
    """
    if len(text) > MAX_LEN:
        limited_text = text[:MAX_LEN] + "..."
    else:
        limited_text = text
    output = limited_text.replace("\n", "<br/>")
    output = re.sub(r"<br/>\s*<br/>", "<br/><br/>", output)
    return output


def get_json_state(json_state: Any) -> dict[str, Any]:
    """Get the JSON state of the event.

    Parameters
    ----------
    json_state : Union[str, dict]
        The JSON state of the event.

    Returns
    -------
    dict
        The JSON state of the event.
    """
    if isinstance(json_state, dict):
        return json_state
    if isinstance(json_state, str):
        try:
            return json.loads(json_state)
        except json.JSONDecodeError:
            return {}
    return {}


# pylint: disable=too-many-locals
def process_events(df_events: pd.DataFrame) -> str:
    """Process the events DataFrame and generate a Mermaid sequence diagram.

    Parameters
    ----------
    df_events : pd.DataFrame
        The DataFrame containing the events' data.

    Returns
    -------
    str
        The Mermaid sequence diagram text.
    """
    # Set to store participants (senders and recipients)
    participants: set[str] = set()
    recipient: str

    # Initialize the sequence diagram text
    seq_text = SEQ_TXT

    # Loop through each event in the DataFrame
    for i in range(len(df_events["json_state"])):
        # Parse the JSON state of the event
        df_j = get_json_state(df_events["json_state"][i])
        # Skip events that are not relevant (e.g., replies or missing messages)
        if ("message" in df_j.keys()) and (
            df_events["event_name"][i] != "reply_func_executed"
        ):
            sender = df_j["sender"]
            # noinspection PyTypeChecker
            recipient = df_events["source_name"][i]

            # Extract message content if available
            if (
                isinstance(df_j["message"], dict)
                and "content" in df_j["message"]
            ):
                content = str(df_j["message"]["content"])
                message = "Content: " + content
            else:
                message = str(df_j["message"])

            # Escape the message for Mermaid compatibility and
            # truncate long messages
            message = escape_mermaid_text(message)

            # Add sender and recipient to participants set
            participants.add(recipient)
            participants.add(sender)

            # Split into the main message and the context
            # if "Content" is present
            if "Content: " in message:
                message_parts = message.split("Content: ")
                main_message = message_parts[0].strip()
                context = "Content: " + message_parts[1].strip()
                seq_text += f"    {sender}->>{recipient}: {main_message}\n"
                seq_text += f"    note over {recipient}: {context}\n"
            else:
                seq_text += f"    {sender}->>{recipient}: {message}\n"

    # Add participants to the Mermaid diagram
    participants_text = ""
    for participant in participants:
        participant_title = participant.replace("_", " ").title()
        participants_text += (
            f"    participant {participant} as {participant_title}" + "\n"
        )
    # Prepend the participants to the sequence diagram text
    mermaid_text = SEQ_TXT + participants_text + seq_text[len(SEQ_TXT) :]
    return mermaid_text


def save_diagram(mermaid_text: str, output_path: str | Path) -> None:
    """Save the Mermaid diagram to a .mmd file.

    Parameters
    ----------
    mermaid_text : str
        The Mermaid sequence diagram text.
    output_path : str | Path
        The path to save the Mermaid diagram.
    """
    with open(output_path, "w", encoding="utf-8", newline="\n") as file:
        file.write(mermaid_text)


def generate_sequence_diagram(
    file_path: str | Path, output_path: str | Path
) -> None:
    """Generate the Mermaid diagram.

    Parameters
    ----------
    file_path : str | Path
        The path to the JSON or CSV file containing the events' data.
    output_path : str | Path
        The path to save the Mermaid diagram.

    Raises
    ------
    FileNotFoundError
        If the input file is not found.

    ValueError
        If the input file is not a JSON or CSV file.
    """
    if isinstance(file_path, str):
        file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    if file_path.suffix not in [".json", ".csv"]:
        raise ValueError("Input file must be a JSON or CSV file.")
    is_csv = file_path.suffix == ".csv"
    try:
        if is_csv:
            df_events = pd.read_csv(file_path)
        else:
            df_events = pd.read_json(file_path)
    except pd.errors.EmptyDataError:  # pragma: no cover
        return

    # Generate the Mermaid sequence diagram text
    mermaid_text = process_events(df_events)

    # Save the Mermaid diagram to a file
    save_diagram(mermaid_text, output_path)
