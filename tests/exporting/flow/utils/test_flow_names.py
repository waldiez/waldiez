# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.exporting.flow.utils.flow_names."""

from typing import Any, Dict

from waldiez.exporting.base.mixin import ExporterMixin
from waldiez.exporting.flow.utils.flow_names import ensure_unique_names
from waldiez.models import Waldiez

from ..flow_helpers import get_flow


# pylint: disable=too-many-locals
def test_ensure_unique_names() -> None:
    """Test ensure_unique_names."""
    get_valid_instance_name = ExporterMixin.get_valid_instance_name
    max_length = 4
    flow_name_max_length = 3
    waldiez_flow = get_flow()
    waldiez = Waldiez(flow=waldiez_flow)
    result = ensure_unique_names(
        waldiez, get_valid_instance_name, max_length, flow_name_max_length
    )
    assert isinstance(result, dict)
    assert isinstance(result["agent_names"], dict)
    assert isinstance(result["model_names"], dict)
    assert isinstance(result["skill_names"], dict)
    assert isinstance(result["chat_names"], dict)
    assert isinstance(result["agents"], list)
    assert isinstance(result["models"], list)
    assert isinstance(result["skills"], list)
    assert isinstance(result["chats"], list)
    assert isinstance(result["flow_name"], str)
    assert result["flow_name"] == waldiez_flow.name[:flow_name_max_length]
    result_dict: Dict[str, Any] = result  # type: ignore
    for key in ["agent_names", "model_names", "skill_names", "chat_names"]:
        # key in dict: the "id" of the instance
        # value in dict: the "name" of the instance (trimmed if necessary)
        instance_thing_key = key.split("_", maxsplit=1)[0] + "s"
        for instance_id, instance_name in result_dict[key].items():
            # assert instance_id in [
            #     instance.id for instance in result_dict[instance_thing_key]
            # ]
            item_in_list = [
                instance
                for instance in result_dict[instance_thing_key]
                if instance.id == instance_id
            ]
            item = item_in_list[0]
            item_dump: Dict[str, Any] = item.model_dump()
            item_name = item_dump.get("name", "")
            assert item_name
            prefix = f"w{key[0]}"
            # chat -> wc_{chat_name}_{index}
            # agent -> wa_{agent_name}_{index}
            # ...
            #
            # either  item_name[:max_length]
            # or      f"{prefix}_{item_name[:max_length]}_{index}"
            is_same = instance_name == item_name[:max_length]
            starts_with = instance_name.startswith(
                f"{prefix}_{item_name[:max_length]}"
            )
            assert is_same or starts_with
