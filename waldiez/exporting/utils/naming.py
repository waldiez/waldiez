"""Naming related string generation functions.

Functions
---------
get_valid_python_variable_name
    Make sure a string is a valid Python variable name.
get_valid_instance_name
    Get a valid instance name.
get_escaped_string
    Get a string with escaped quotes and newlines.
"""

import re
from typing import Dict, Tuple


def get_valid_python_variable_name(
    possible: str,
    prefix: str = "w",
) -> str:
    """Get a valid Python variable name from a possible name.

    Parameters
    ----------
    possible : str
        The possible name.

    prefix : str, optional
        The prefix to use if the name starts with a digit or special character

    Returns
    -------
    str
        The valid Python variable name.
    """

    def replacement(match: re.Match[str]) -> str:
        """Get the replacement for the match.

        Parameters
        ----------
        match : re.Match[str]
            The match.

        Returns
        -------
        str
            The replacement
        """
        if match.group(0) in ["->", "=>"]:
            return "to"
        if match.group(0) in ["<-", "<="]:
            return "from"
        if re.match(r"\W|^(?=\d)", match.group(0)):
            return "_"
        return match.group(0)

    possible = re.sub(r"->|=>|<-|<=|\W|^(?=\d)", replacement, possible)[
        :64
    ].lower()

    if not possible:
        return prefix + "_"
    if possible.startswith("_"):
        return f"{prefix}{possible}"
    if possible[0].isdigit():
        return f"{prefix}_{possible}"
    return possible


def get_valid_instance_name(
    instance: Tuple[str, str],
    current_names: Dict[str, str],
    prefix: str = "w",
) -> Dict[str, str]:
    """Get a valid instance name.

    If the instance id is already in the current names nothing is done.
    If the name already exists in the current names,
        the name is updated (with an index suffix).

    Parameters
    ----------
    instance : Tuple[str, str]
        The instance id and possible name.
    current_names : Dict[str, str]
        The current names.
    prefix : str, optional
        The prefix to use if the name starts with a digit,
        if the name is already in the current names,
        or if the name is already in the current names with an index suffix.

    Returns
    -------
    Dict[str, str]
        The updated names.
    """
    instance_id, possible_name = instance
    if instance_id in current_names:
        return current_names
    new_names = current_names.copy()
    name = get_valid_python_variable_name(possible_name, prefix)
    if name in current_names.values():
        name = f"{prefix}_{name}"
    if name in current_names.values():
        index = 1
        while f"{name}_{index}" in current_names.values():
            index += 1
        name = f"{name}_{index}"
    new_names[instance_id] = name
    return new_names


def get_escaped_string(string: str) -> str:
    """Get a string with escaped quotes and newlines.

    Parameters
    ----------
    string : str
        The original string.

    Returns
    -------
    str
        The escaped string.
    """
    return string.replace('"', '\\"').replace("\n", "\\n")