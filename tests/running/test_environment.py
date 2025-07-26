# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.running.environment.*."""

import os
import warnings

from waldiez.running.environment import (
    in_virtualenv,
    refresh_environment,
    reset_env_vars,
    set_env_vars,
)


def test_in_virtualenv() -> None:
    """Test in_virtualenv."""
    # When
    result = in_virtualenv()
    # Then
    assert isinstance(result, bool)


def test_refresh_environment() -> None:
    """Test refresh_environment."""
    # Given
    # pylint: disable=import-outside-toplevel, unused-import
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            module="flaml",
            message="^.*flaml.automl is not available.*$",
        )
        from autogen import ConversableAgent  # type: ignore  # noqa
        from autogen.io import IOStream  # type: ignore  # noqa

    # noinspection PyUnboundLocalVariable
    default_io_stream = IOStream.get_default()
    # When
    refresh_environment()
    # Then
    assert IOStream.get_default() == default_io_stream


def test_set_env_vars() -> None:
    """Test set_env_vars."""
    # Given
    flow_env_vars = [("FLOW_ENV_VAR", "value")]
    # When
    old_vars = set_env_vars(flow_env_vars)
    # Then
    assert isinstance(old_vars, dict)
    assert os.environ["FLOW_ENV_VAR"] == "value"
    # When
    reset_env_vars(old_vars)
    # Then
    assert "FLOW_ENV_VAR" not in os.environ
    # Given
    flow_env_vars = [("", "4")]
    # When
    old_vars = set_env_vars(flow_env_vars)
    # Then
    assert isinstance(old_vars, dict)
    assert not old_vars


def test_reset_env_vars() -> None:
    """Test reset_env_vars."""
    # Given
    flow_env_vars = [("FLOW_ENV_VAR", "value"), ("FLOW_ENV_VAR_2", "")]
    old_vars = set_env_vars(flow_env_vars)
    # When
    reset_env_vars(old_vars)
    # Then
    assert "FLOW_ENV_VAR" not in os.environ

    # Given
    flow_env_vars = [("FLOW_ENV_VAR", "value")]
    _ = set_env_vars(flow_env_vars)
    # When
    reset_env_vars({})
    # Then
    assert "FLOW_ENV_VAR" in os.environ
    assert os.environ["FLOW_ENV_VAR"] == "value"
    os.environ.pop("FLOW_ENV_VAR")

    # Given
    old_vars = {"FLOW_ENV_VAR": "value", "FLOW_ENV_VAR_2": ""}
    # When
    reset_env_vars(old_vars)
    # Then
    assert "FLOW_ENV_VAR" in os.environ
    assert "FLOW_ENV_VAR_2" not in os.environ
    os.environ.pop("FLOW_ENV_VAR")
