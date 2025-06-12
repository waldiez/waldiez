# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test the shared with ts schema."""

import json
from pathlib import Path
from typing import Any

from jsonschema import validate
from jsonschema.exceptions import SchemaError, ValidationError

from waldiez.models import WaldiezFlow

from .exporting.flow_helpers import get_flow


def load_shared_schema() -> dict[str, Any]:
    """Load the shared with ts schema.

    Returns
    -------
    dict[str, Any]
        The shared with ts schema.
    """
    schema_path = Path(__file__).parent.parent / "schema.json"
    with open(schema_path, "r", encoding="utf-8") as schema_file:
        schema = json.load(schema_file)
    return schema


def test_schema_compatibility() -> None:
    """Test the schema of the shared with ts model.

    Raises
    ------
    AssertionError
        If the schema is not compatible with the model.
    """
    shared_schema = load_shared_schema()
    dummy_data = get_flow().model_dump()

    try:
        validate(instance=dummy_data, schema=shared_schema)
    except SchemaError as e:
        raise AssertionError(f"Schema error: {e}") from e
    except ValidationError as e:
        raise AssertionError(f"Validation error: {e}") from e

    default_flow = WaldiezFlow.default()
    try:
        validate(instance=default_flow.model_dump(), schema=shared_schema)
    except SchemaError as e:
        raise AssertionError(f"Schema error: {e}") from e
    except ValidationError as e:
        raise AssertionError(f"Validation error: {e}") from e
