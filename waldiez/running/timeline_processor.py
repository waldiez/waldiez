# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# pylint: skip-file
# pyright: reportArgumentType=false,reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false,reportUnknownArgumentType=false
# flake8: noqa: C901
"""
Timeline Analysis Data Processor.

Processes CSV files and outputs JSON structure for timeline visualization
"""

import json
import os
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pandas as pd

from waldiez.logger import WaldiezLogger

if TYPE_CHECKING:
    Series = pd.Series[Any]
else:
    Series = pd.Series

# Color palettes
AGENT_COLORS = [
    "#FF6B35",
    "#4A90E2",
    "#7ED321",
    "#9013FE",
    "#FF9500",
    "#FF3B30",
    "#007AFF",
    "#34C759",
    "#AF52DE",
    "#FF9F0A",
    "#FF2D92",
    "#5AC8FA",
    "#30D158",
    "#BF5AF2",
    "#FFD60A",
    "#FF453A",
    "#64D2FF",
    "#32D74B",
    "#DA70D6",
    "#FFD23F",
]

ACTIVITY_COLORS = {
    "human_input_waiting": "#FF8C00",
    "user_thinking": "#87CEEB",
    "agent_transition": "#FF7043",
    "tool_call": "#4CAF50",
    "function_call": "#9C27B0",
    "processing": "#BDBDBD",
    "session": "#8B5CF6",
}

DEFAULT_AGENT_COLOR = "#E5E7EB"

LOG = WaldiezLogger()


# noinspection PyMethodMayBeStatic,PyTypeHints
class TimelineProcessor:
    """Class to process timeline data from CSV files."""

    agents_data: pd.DataFrame | None
    chat_data: pd.DataFrame | None
    events_data: pd.DataFrame | None
    functions_data: pd.DataFrame | None

    def __init__(self) -> None:
        """Initialize the TimelineProcessor with empty data attributes."""
        self.agents_data = None
        self.chat_data = None
        self.events_data = None
        self.functions_data = None

    def is_missing_or_nan(self, value: Any) -> bool:
        """Check if a value is missing, NaN, or empty.

        Parameters
        ----------
        value : Any
            The value to check.

        Returns
        -------
        bool
            True if the value is missing, NaN, or empty; False otherwise.
        """
        if pd.isna(value):
            return True
        if isinstance(value, str) and (
            value.strip() == "" or value.lower() == "nan"
        ):
            return True
        return False

    def fill_missing_agent_names(
        self, data: pd.DataFrame | None, name_column: str = "source_name"
    ) -> pd.DataFrame | None:
        """Fill missing agent names with the previous valid name.

        Parameters
        ----------
        data : pd.DataFrame | None
            DataFrame containing agent names.
        name_column : str, optional
            The column name containing agent names, by default "source_name".

        Returns
        -------
        pd.DataFrame | None
            DataFrame with missing agent names filled.
        """
        if data is None or data.empty:
            return data

        data = data.copy()
        last_valid_name: str | None = None

        for idx in range(len(data)):
            current_name = data.iloc[idx][name_column]

            if self.is_missing_or_nan(current_name):
                if last_valid_name is not None:
                    column = data.columns.get_loc(name_column)
                    data.iloc[idx, column] = last_valid_name  # type: ignore[index]
                    LOG.debug(
                        "Row %d: Replaced missing agent name with '%s'",
                        idx,
                        last_valid_name,
                    )
                else:
                    # If no previous valid name, use a default
                    default_name = "unknown_agent"
                    column = data.columns.get_loc(name_column)
                    data.iloc[idx, column] = default_name  # type: ignore[index]
                    last_valid_name = default_name
                    LOG.debug(
                        "Row %d: Used default agent name '%s'",
                        idx,
                        default_name,
                    )
            else:
                # noinspection PyTypeChecker
                last_valid_name = current_name

        return data

    def fill_missing_agent_data(self) -> None:
        """Fill missing agent names in agents_data."""
        if self.agents_data is None:
            return

        self.agents_data = self.fill_missing_agent_names(
            self.agents_data, "name"
        )

    def load_csv_files(
        self,
        agents_file: str | None = None,
        chat_file: str | None = None,
        events_file: str | None = None,
        functions_file: str | None = None,
    ) -> None:
        """Load CSV files into pandas DataFrames.

        Parameters
        ----------
        agents_file : str | None
            Path to the agents CSV file.
        chat_file : str | None
            Path to the chat CSV file.
        events_file : str | None
            Path to the events CSV file.
        functions_file : str | None
            Path to the functions CSV file.
        """
        if agents_file:
            self.agents_data = pd.read_csv(agents_file)
            LOG.info("Loaded agents data: %d rows", len(self.agents_data))
            # Fill missing agent names
            self.fill_missing_agent_data()

        if chat_file:
            self.chat_data = pd.read_csv(chat_file)
            LOG.info("Loaded chat data: %d rows", len(self.chat_data))
            # Fill missing agent names in chat data
            self.chat_data = self.fill_missing_agent_names(
                self.chat_data, "source_name"
            )

        if events_file:
            self.events_data = pd.read_csv(events_file)
            LOG.info("Loaded events data: %d rows", len(self.events_data))

        if functions_file:
            self.functions_data = pd.read_csv(functions_file)
            LOG.info("Loaded functions data: %d rows", len(self.functions_data))

    def parse_date(self, date_str: str) -> pd.Timestamp:
        """Parse date string to datetime.

        Parameters
        ----------
        date_str : str
            The date string to parse.

        Returns
        -------
        pd.Timestamp
            The parsed datetime.
        """
        # noinspection PyBroadException
        try:
            return pd.to_datetime(date_str)
        except Exception:
            coerced = pd.to_datetime(date_str, errors="coerce")
            if isinstance(coerced, pd.Timestamp):
                return coerced
            return pd.Timestamp("1970-01-01")

    # noinspection PyMethodMayBeStatic
    def generate_agent_colors(self, agent_names: list[str]) -> dict[str, str]:
        """Generate color mapping for agents.

        Parameters
        ----------
        agent_names : list[str]
            List of agent names.

        Returns
        -------
        dict[str, str]
            Mapping of agent names to their assigned colors.
        """
        colors = {}
        for i, agent in enumerate(agent_names):
            colors[agent] = AGENT_COLORS[i % len(AGENT_COLORS)]
        return colors

    def extract_token_info(
        self,
        request_str: Any,
        response_str: Any,
    ) -> dict[str, int]:
        """Extract token information from request/response strings.

        Parameters
        ----------
        request_str : Any
            The request string containing token usage information.
        response_str : Any
            The response string containing token usage information.

        Returns
        -------
        dict[str, int]
            A dictionary containing the extracted token information.
        """
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
        try:
            # Try to parse as JSON first
            if (
                request_str
                and isinstance(request_str, str)
                and request_str.strip().startswith("{")
            ):
                request_data = json.loads(request_str)
                if "usage" in request_data:
                    prompt_tokens = request_data["usage"].get(
                        "prompt_tokens", 0
                    )
                elif "prompt_tokens" in request_data:
                    prompt_tokens = request_data["prompt_tokens"]
                elif "messages" in request_data:
                    # Estimate tokens from content length
                    content_length = sum(
                        len(msg.get("content", ""))
                        for msg in request_data["messages"]
                        if "content" in msg and msg["content"]
                    )
                    prompt_tokens = max(1, content_length // 4)

            if (
                response_str
                and isinstance(response_str, str)
                and response_str.strip().startswith("{")
            ):
                response_data = json.loads(response_str)
                if "usage" in response_data:
                    prompt_tokens = response_data["usage"].get(
                        "prompt_tokens", prompt_tokens
                    )
                    completion_tokens = response_data["usage"].get(
                        "completion_tokens", 0
                    )
                    total_tokens = response_data["usage"].get(
                        "total_tokens", prompt_tokens + completion_tokens
                    )
        except json.JSONDecodeError:
            # Fallback to regex patterns if JSON parsing fails
            pass

        if total_tokens == 0 and (prompt_tokens > 0 or completion_tokens > 0):
            total_tokens = prompt_tokens + completion_tokens

        return {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
        }

    def extract_llm_model(
        self, agent_name: str, request_str: Any = None
    ) -> str:
        """Extract LLM model from agent data or request.

        Parameters
        ----------
        agent_name : str
            The name of the agent.
        request_str : Any, optional
            The request string containing token usage information.

        Returns
        -------
        str
            The extracted LLM model name.
        """
        # Handle missing/nan agent names
        if self.is_missing_or_nan(agent_name):
            agent_name = "unknown_agent"

        # First try to extract from request_str (chat_completions.csv)
        if request_str:
            model = self._extract_model_from_text(str(request_str))
            if model != "Unknown":
                return model

        # Then try to extract from agents data
        if self.agents_data is not None:
            agent_row = self.agents_data[self.agents_data["name"] == agent_name]
            if not agent_row.empty and "init_args" in agent_row.columns:
                init_args = str(agent_row.iloc[0]["init_args"])
                model = self._extract_model_from_text(init_args)
                if model != "Unknown":
                    return model

        return "Unknown"

    def _extract_model_from_text(self, text: Any) -> str:
        """Extract model name from text using dynamic parsing.

        Parameters
        ----------
        text : Any
            The text to extract the model name from.

        Returns
        -------
        str
            The extracted model name.
        """
        if not text or not isinstance(text, str):
            return "Unknown"

        try:
            # Try JSON parsing first
            if text.strip().startswith("{"):
                model = self._extract_model_from_json(text)
                if model != "Unknown":
                    return model
        except json.JSONDecodeError:
            pass

        # Use dynamic regex patterns to catch any model-like strings
        model = self._extract_model_with_regex(text)
        if model != "Unknown":
            return model

        return "Unknown"

    def _extract_model_from_json(self, text: str) -> str:
        """Extract model from JSON text using comprehensive key search.

        Parameters
        ----------
        text : str
            The JSON text to extract the model name from.

        Returns
        -------
        str
            The extracted model name.
        """
        try:
            parsed = json.loads(text)

            # Direct model keys
            model_keys = [
                "model",
                "llm_model",
                "engine",
                "model_name",
                "model_id",
            ]
            for key in model_keys:
                if key in parsed and isinstance(parsed[key], str):
                    return parsed[key]

            # Nested searches for different structures
            # Structure 1: config_list array (from agents.csv)
            if "config_list" in parsed and isinstance(
                parsed["config_list"], list
            ):
                for config in parsed["config_list"]:
                    if isinstance(config, dict) and "model" in config:
                        return config["model"]

            # Structure 2: llm_config._model.config_list (from agents.csv)
            if "llm_config" in parsed:
                llm_config = parsed["llm_config"]
                if isinstance(llm_config, dict):
                    if "_model" in llm_config and isinstance(
                        llm_config["_model"], dict
                    ):
                        model_config = llm_config["_model"]
                        if "config_list" in model_config and isinstance(
                            model_config["config_list"], list
                        ):
                            for config in model_config["config_list"]:
                                if (
                                    isinstance(config, dict)
                                    and "model" in config
                                ):
                                    return config["model"]
                        # Also check direct model keys in _model
                        for key in model_keys:
                            if key in model_config and isinstance(
                                model_config[key], str
                            ):
                                return model_config[key]

                    # Check llm_config level for model keys
                    for key in model_keys:
                        if key in llm_config and isinstance(
                            llm_config[key], str
                        ):
                            return llm_config[key]

            # Structure 3: Recursive search for any model key in nested objects

            model = recursive_search(parsed, model_keys)
            if model != "Unknown":
                return model

        except (json.JSONDecodeError, AttributeError, TypeError):
            pass

        return "Unknown"

    def _extract_model_with_regex(self, text: str) -> str:
        """Extract model using flexible regex patterns.

        Parameters
        ----------
        text : str
            The input text from which to extract the model name.

        Returns
        -------
        str
            The extracted model name or "Unknown" if not found.
        """
        # Dynamic patterns that can catch various model names
        patterns = [
            # OpenAI models - flexible to catch versions like gpt-4.1, gpt-4o...
            r"\bgpt-[0-9]+(?:\.[0-9]+)?[a-zA-Z]*(?:-[a-zA-Z0-9]+)*\b",
            # Claude models - flexible for various versions
            r"\bclaude-[0-9]+(?:\.[0-9]+)?(?:-[a-zA-Z0-9]+)*\b",
            # Gemini models
            r"\bgemini-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\b",
            # Generic model patterns
            r"\b[a-zA-Z]+-[0-9]+(?:\.[0-9]+)?[a-zA-Z]*(?:-[a-zA-Z0-9]+)*\b",
            # Anthropic models
            r"\b(?:anthropic|claude)[/_-][a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*\b",
            # Other common patterns
            r"\b(?:llama|mistral|falcon|vicuna|alpaca)[/_-]?[0-9]+[a-zA-Z]*(?:[._-][a-zA-Z0-9]+)*\b",
            # Cohere models
            r"\bcommand[/_-]?[a-zA-Z0-9]*\b",
            # Generic AI model patterns
            r"\b[a-zA-Z]+(?:ai|ml|model)[/_-]?[0-9]+[a-zA-Z]*\b",
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Return the first match, but prefer longer matches
                best_match = max(matches, key=len)
                return (
                    best_match
                    if isinstance(best_match, str)
                    else str(best_match)
                )

        # Last resort: look for any word that might be a model name
        # This catches custom or unknown models
        model_indicators = [
            r'model["\']?\s*[:=]\s*["\']?([a-zA-Z0-9._-]+)',
            r'engine["\']?\s*[:=]\s*["\']?([a-zA-Z0-9._-]+)',
            r'"model"\s*:\s*"([^"]+)"',
            r"'model'\s*:\s*'([^']+)'",
        ]

        for pattern in model_indicators:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return matches[0]

        return "Unknown"

    # noinspection PyTypeChecker
    def is_human_input_waiting_period(
        self,
        prev_session: Series,
        current_session: Series,
        gap_duration: float,
    ) -> bool:
        """Detect if gap represents human input waiting.

        Parameters
        ----------
        prev_session : Series
            The previous session data.
        current_session : Series
            The current session data.
        gap_duration : float
            The duration of the gap to analyze.

        Returns
        -------
        bool
            True if gap likely represents human input waiting, False otherwise.
        """
        if gap_duration < 1.0:  # Reduced threshold for better detection
            return False

        if self.events_data is None:
            return False

        # Get events around the gap period
        prev_end = self.parse_date(prev_session["end_time"])
        current_start = self.parse_date(current_session["start_time"])

        # Look for user message events right after the gap (within 1 second)
        after_gap_window = current_start + pd.Timedelta(seconds=1)

        user_events_after_gap = self.events_data[
            (pd.to_datetime(self.events_data["timestamp"]) >= current_start)
            & (
                pd.to_datetime(self.events_data["timestamp"])
                <= after_gap_window
            )
            & (self.events_data["event_name"] == "received_message")
        ]

        # Check if any of these events contain user messages
        user_message_found = False
        for _, event in user_events_after_gap.iterrows():
            if self.is_user_message_event(event):
                user_message_found = True
                break

        if user_message_found:
            return True

        # Alternative check: look for gaps that are longer and likely represent
        # user thinking time
        # This catches cases where user input detection might be missed
        if gap_duration > 5.0:  # Longer gaps are more likely to be user input
            # Check if there are any user messages in the broader timeline
            # around this gap
            broader_window_start = prev_end - pd.Timedelta(seconds=2)
            broader_window_end = current_start + pd.Timedelta(seconds=5)

            broader_events = self.events_data[
                (
                    pd.to_datetime(self.events_data["timestamp"])
                    >= broader_window_start
                )
                & (
                    pd.to_datetime(self.events_data["timestamp"])
                    <= broader_window_end
                )
            ]

            # Look for user message patterns
            for _, event in broader_events.iterrows():
                if self.is_user_message_event(event):
                    return True

        return False

    def is_user_message_event(self, event: Series) -> bool:
        """Check if an event represents a user message.

        Parameters
        ----------
        event : Series
            The event data to check.

        Returns
        -------
        bool
            True if the event represents a user message, False otherwise.
        """
        json_state = event.get("json_state", "")
        if not json_state or not isinstance(json_state, str):
            return False

        try:
            parsed = json.loads(json_state)
            # Check for user role in message
            if parsed.get("message", {}).get("role") == "user":
                return True
            # Check for customer sender (another indicator of user input)
            if parsed.get("sender") == "customer":
                return True
        except (json.JSONDecodeError, AttributeError, TypeError):
            pass

        return False

    # noinspection PyTypeChecker
    def categorize_gap_activity(
        self,
        prev_session: Series,
        current_session: Series,
        gap_duration: float,
    ) -> dict[str, Any]:
        """Categorize what happened during a gap.

        Parameters
        ----------
        prev_session : Series
            The previous session data.
        current_session : Series
            The current session data.
        gap_duration : float
            The duration of the gap in seconds.

        Returns
        -------
        dict[str, Any]
            A dictionary categorizing the gap activity.
        """
        # First check for human input waiting period
        if self.is_human_input_waiting_period(
            prev_session, current_session, gap_duration
        ):
            return {
                "type": "human_input_waiting",
                "label": "👤 Human Input",
                "detail": f"Waiting for user ({gap_duration:.1f}s)",
            }

        # Check for function calls during gap
        if self.functions_data is not None:
            prev_end = self.parse_date(prev_session["end_time"])
            current_start = self.parse_date(current_session["start_time"])

            gap_functions = self.functions_data[
                (pd.to_datetime(self.functions_data["timestamp"]) >= prev_end)
                & (
                    pd.to_datetime(self.functions_data["timestamp"])
                    <= current_start
                )
            ]

            if not gap_functions.empty:
                primary_function = gap_functions.iloc[0]["function_name"]

                if (
                    "transfer" in primary_function.lower()
                    or "switch" in primary_function.lower()
                ):
                    detail = (
                        f"{primary_function} → {current_session['source_name']}"
                    )
                    return {
                        "type": "agent_transition",
                        "label": "🔄 Transfer",
                        "detail": detail,
                    }
                else:
                    return {
                        "type": "tool_call",
                        "label": f"🛠️ {primary_function.replace('_', ' ')}",
                        "detail": "Tool execution",
                    }

        # Check if agent changed
        if prev_session["source_name"] != current_session["source_name"]:
            detail = (
                f"{prev_session['source_name']} → "
                f"{current_session['source_name']}"
            )
            return {
                "type": "agent_transition",
                "label": "🔄 Agent Switch",
                "detail": detail,
            }

        # For longer gaps without clear indicators,
        # they might still be user input
        # This provides a fallback for cases
        # where the user input detection might miss
        if gap_duration > 8.0:  # Longer gaps are more likely to be user input
            return {
                "type": "human_input_waiting",
                "label": "👤 Likely User Input",
                "detail": f"Probable user input ({gap_duration:.1f}s)",
            }

        return {
            "type": "processing",
            "label": "⚙️ Processing",
            "detail": f"Processing ({gap_duration:.1f}s)",
        }

    # noinspection PyUnusedLocal
    def compress_timeline(
        self,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], float, float]:
        """Create compressed timeline from chat data.

        Processes chat data and generates a compressed timeline with gaps,
        sessions, and cost information.

        Returns
        -------
        tuple[list[dict[str, Any]], list[dict[str, Any]], float, float]
            A tuple containing:
            - Compressed timeline as a list of dictionaries.
            - Cost timeline as a list of dictionaries.
            - Total compressed time.
            - Cumulative cost.

        Raises
        ------
        ValueError
            If chat data is not provided.
        """
        if self.chat_data is None:
            raise ValueError("Chat data is required")

        LOG.info("Starting timeline compression...")

        # Sort by start time and calculate durations
        chat_sorted = self.chat_data.copy()
        chat_sorted["start_time"] = pd.to_datetime(chat_sorted["start_time"])
        chat_sorted["end_time"] = pd.to_datetime(chat_sorted["end_time"])
        chat_sorted = chat_sorted.sort_values("start_time")
        chat_sorted["duration"] = (
            chat_sorted["end_time"] - chat_sorted["start_time"]
        ).dt.total_seconds()

        LOG.info(
            "Sorted chat data by start time. Total sessions: %d",
            len(chat_sorted),
        )

        timeline: list[dict[str, Any]] = []
        cost_timeline: list[dict[str, Any]] = []
        current_compressed_time = 0.0
        cumulative_cost = 0.0
        session_id = 1

        for _i, (_idx, row) in enumerate(chat_sorted.iterrows()):
            try:
                # Get agent name and handle missing values
                agent_name = row["source_name"]
                if self.is_missing_or_nan(agent_name):
                    agent_name = "unknown_agent"

                LOG.debug(
                    "Processing session %d: %s",
                    session_id,
                    agent_name,
                )
                start_compressed = current_compressed_time
                gap_before = 0
                gap_activity = None

                if session_id > 1:  # Not the first session
                    prev_row = chat_sorted.iloc[session_id - 2]  # Previous row
                    gap_duration = (
                        row["start_time"] - prev_row["end_time"]
                    ).total_seconds()

                    gap_activity = self.categorize_gap_activity(
                        prev_row, row, gap_duration
                    )

                    # Determine compressed gap duration
                    if gap_activity["type"] == "human_input_waiting":
                        compressed_gap = 1.0
                        gap_before = gap_duration
                    elif gap_duration > 2.0 and gap_activity["type"] in [
                        "processing",
                        "user_thinking",
                    ]:
                        compressed_gap = 2.0
                        gap_before = gap_duration
                    else:
                        compressed_gap = gap_duration
                        gap_before = gap_duration

                    # Add gap to timeline if significant
                    if gap_before > 0.1:
                        gap_start = current_compressed_time
                        gap_end = gap_start + compressed_gap

                        timeline.append(
                            {
                                "id": f"gap_{session_id - 1}",
                                "type": "gap",
                                "gap_type": gap_activity["type"],
                                "start": gap_start,
                                "end": gap_end,
                                "duration": compressed_gap,
                                "value": compressed_gap,
                                "real_duration": gap_before,
                                "compressed": gap_activity["type"]
                                == "human_input_waiting"
                                or (
                                    gap_duration > 2.0
                                    and gap_activity["type"]
                                    in ["processing", "user_thinking"]
                                ),
                                "color": ACTIVITY_COLORS.get(
                                    gap_activity["type"],
                                    ACTIVITY_COLORS["processing"],
                                ),
                                "label": (
                                    gap_activity["label"]
                                    + f" ({gap_before:.1f}s)"
                                    if gap_before != compressed_gap
                                    else gap_activity["label"]
                                ),
                                "y_position": session_id - 0.5,
                            }
                        )

                    current_compressed_time += compressed_gap
                    start_compressed = current_compressed_time

                end_compressed = start_compressed + row["duration"]

                # Extract token info with error handling
                try:
                    token_info = self.extract_token_info(
                        row.get("request", ""), row.get("response", "")
                    )
                except Exception as e:
                    LOG.error(
                        "Error extracting token info for session %s: %s",
                        session_id,
                        e,
                    )
                    token_info = {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                    }

                # Add session to timeline
                timeline.append(
                    {
                        "id": f"session_{session_id}",
                        "type": "session",
                        "start": start_compressed,
                        "end": end_compressed,
                        "duration": row["duration"],
                        "value": row["duration"],
                        "agent": agent_name,
                        # Will be updated if agents data available
                        "agent_class": agent_name,
                        "cost": row.get("cost", 0),
                        "tokens": token_info["total_tokens"],
                        "prompt_tokens": token_info["prompt_tokens"],
                        "completion_tokens": token_info["completion_tokens"],
                        "events": 1,  # Placeholder
                        "color": DEFAULT_AGENT_COLOR,  # Will be updated later
                        "label": f"S{session_id}: {agent_name}",
                        "is_cached": bool(row.get("is_cached", False)),
                        "y_position": session_id,
                        "llm_model": self.extract_llm_model(
                            agent_name, row.get("request", "")
                        ),
                        "session_id": row.get(
                            "session_id", f"session_{session_id}"
                        ),
                        "real_start_time": row["start_time"].strftime(
                            "%H:%M:%S"
                        ),
                        "request": row.get("request", ""),
                        "response": row.get("response", ""),
                    }
                )

                # Add to cost timeline
                cumulative_cost += row.get("cost", 0)
                cost_timeline.append(
                    {
                        "time": start_compressed + row["duration"] / 2,
                        "cumulative_cost": cumulative_cost,
                        "session_cost": row.get("cost", 0),
                        "session_id": session_id,
                    }
                )

                current_compressed_time = end_compressed
                session_id += 1

            except Exception as e:
                LOG.error(
                    "Error processing session %d: %s",
                    session_id,
                    e,
                )
                LOG.error("Row data: %s", dict(row))
                raise

        # Finalize timeline
        if not timeline:
            LOG.warning("No valid sessions found in chat data.")
            return [], [], 0.0, 0.0
        LOG.info(
            "Timeline compression complete. Generated %d items.",
            len(timeline),
        )
        return timeline, cost_timeline, current_compressed_time, cumulative_cost

    def process_timeline(self) -> dict[str, Any]:
        """Timeline processing function.

        Processes chat data and generates a timeline with summary statistics.

        Returns
        -------
        dict
            A dictionary containing the processed timeline, cost timeline,
        """
        if self.chat_data is None:
            raise ValueError("Chat data is required for processing")

        timeline, cost_timeline, total_time, total_cost = (
            self.compress_timeline()
        )

        # Get unique agents and assign colors
        # (filter out any remaining NaN values)
        agents_in_timeline = list(
            {
                item["agent"]
                for item in timeline
                if item["type"] == "session"
                and not self.is_missing_or_nan(item["agent"])
            }
        )
        agent_colors = self.generate_agent_colors(agents_in_timeline)

        # Update timeline with colors and agent classes
        for item in timeline:
            if item["type"] == "session":
                agent_name = item["agent"]
                if self.is_missing_or_nan(agent_name):
                    agent_name = "unknown_agent"
                    item["agent"] = agent_name

                item["color"] = agent_colors.get(
                    agent_name, DEFAULT_AGENT_COLOR
                )

                # Update agent class if agents data available
                if self.agents_data is not None:
                    agent_row = self.agents_data[
                        self.agents_data["name"] == agent_name
                    ]
                    if not agent_row.empty and "class" in agent_row.columns:
                        agent_class = agent_row.iloc[0]["class"]
                        if not self.is_missing_or_nan(agent_class):
                            item["agent_class"] = agent_class

        # Create agents list
        agents: list[dict[str, Any]] = []
        for agent_name in agents_in_timeline:
            if self.is_missing_or_nan(agent_name):
                continue

            agent_class = agent_name  # Default
            if self.agents_data is not None:
                agent_row = self.agents_data[
                    self.agents_data["name"] == agent_name
                ]
                if not agent_row.empty and "class" in agent_row.columns:
                    agent_class_value = agent_row.iloc[0]["class"]
                    if not self.is_missing_or_nan(agent_class_value):
                        agent_class = agent_class_value

            agents.append(
                {
                    "name": agent_name,
                    "class": agent_class,
                    "color": agent_colors.get(agent_name, DEFAULT_AGENT_COLOR),
                }
            )

        # Calculate summary statistics
        sessions = [item for item in timeline if item["type"] == "session"]
        gaps = [item for item in timeline if item["type"] == "gap"]

        total_tokens = sum(session["tokens"] for session in sessions)
        gaps_compressed = sum(1 for gap in gaps if gap["compressed"])
        time_saved = sum(
            gap["real_duration"] - gap["duration"]
            for gap in gaps
            if gap["compressed"]
        )

        # Get model statistics
        model_stats = {}
        for session in sessions:
            model = session.get("llm_model", "Unknown")
            if model not in model_stats:
                model_stats[model] = {"count": 0, "tokens": 0, "cost": 0}
            model_stats[model]["count"] += 1
            model_stats[model]["tokens"] += session.get("tokens", 0)
            model_stats[model]["cost"] += session.get("cost", 0)

        summary = {
            "total_sessions": len(sessions),
            "total_time": total_time,
            "total_cost": total_cost,
            "total_agents": len(agents_in_timeline),
            "total_events": sum(session["events"] for session in sessions),
            "total_tokens": total_tokens,
            "avg_cost_per_session": (
                total_cost / len(sessions) if sessions else 0
            ),
            "compression_info": {
                "gaps_compressed": gaps_compressed,
                "time_saved": time_saved,
            },
            "model_stats": model_stats,
        }

        # Create metadata
        max_time = max([item["end"] for item in timeline]) if timeline else 0
        max_cost = (
            max([point["cumulative_cost"] for point in cost_timeline])
            if cost_timeline
            else 0
        )

        metadata = {
            "time_range": [0, max_time * 1.1],
            "cost_range": [0, max_cost * 1.1],
            "colors": {
                "human_input": ACTIVITY_COLORS["human_input_waiting"],
                "processing": ACTIVITY_COLORS["processing"],
                "agent_transition": ACTIVITY_COLORS["agent_transition"],
                "cost_line": "#E91E63",
            },
        }

        return {
            "timeline": timeline,
            "cost_timeline": cost_timeline,
            "summary": summary,
            "metadata": metadata,
            "agents": agents,
        }

    @staticmethod
    def get_short_results(results: dict[str, Any]) -> dict[str, Any]:
        """Remove request/response from the timeline entries.

        Parameters
        ----------
        results : dict[str, Any]
            The original results dictionary.

        Returns
        -------
        dict[str, Any]
            The modified results dictionary with shortened timeline.
        """
        new_results = results.copy()
        new_results["timeline"] = []
        for item in results["timeline"]:
            new_item = item.copy()
            # Remove request and response fields
            new_item.pop("request", None)
            new_item.pop("response", None)
            new_results["timeline"].append(new_item)
        return new_results

    @staticmethod
    def get_files(logs_dir: Path | str) -> dict[str, str | None]:
        """Get all CSV files in the specified directory.

        Parameters
        ----------
        logs_dir : Path | str
            The directory to search for CSV files.

        Returns
        -------
        dict[str, str | None]
            A dictionary mapping CSV file names to their paths
            or None if not found.
        """
        agents_file = os.path.join(logs_dir, "agents.csv")
        chat_file = os.path.join(logs_dir, "chat_completions.csv")
        events_file = os.path.join(logs_dir, "events.csv")
        functions_file = os.path.join(logs_dir, "function_calls.csv")

        return {
            "agents": agents_file if os.path.exists(agents_file) else None,
            "chat": chat_file if os.path.exists(chat_file) else None,
            "events": events_file if os.path.exists(events_file) else None,
            "functions": (
                functions_file if os.path.exists(functions_file) else None
            ),
        }


def recursive_search(obj: Any, keys_to_find: list[str]) -> str:
    """Recursively search for keys in a nested structure.

    Parameters
    ----------
    obj : Any
        The object to search within.
    keys_to_find : list[str]
        The keys to search for.

    Returns
    -------
    str
        The found value or "Unknown" if not found.
    """
    if isinstance(obj, dict):
        for key in keys_to_find:
            if key in obj and isinstance(obj[key], str) and obj[key].strip():
                return obj[key]
        for value in obj.values():
            result = recursive_search(value, keys_to_find)
            if result != "Unknown":
                return result
    elif isinstance(obj, list):
        for item in obj:
            result = recursive_search(item, keys_to_find)
            if result != "Unknown":
                return result
    return "Unknown"
