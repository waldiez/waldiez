# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Test waldiez.models.model.WaldiezModelAWS."""

from waldiez.models.model import WaldiezModelAWS


def test_waldiez_model_aws_defaults() -> None:
    """Test WaldiezModelAWS with default values."""
    # Given/When
    aws = WaldiezModelAWS()

    # Then
    assert aws.region is None
    assert aws.access_key is None
    assert aws.secret_key is None
    assert aws.session_token is None
    assert aws.profile_name is None


def test_waldiez_model_aws_with_values() -> None:
    """Test WaldiezModelAWS with specified values."""
    # Given
    region = "us-west-2"
    access_key = "AKIAIOSFODNN7EXAMPLE"  # nosemgrep # nosec
    secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  # nosemgrep # nosec
    session_token = "session_token_example"  # nosemgrep # nosec
    profile_name = "default"

    # When
    aws = WaldiezModelAWS(
        region=region,
        access_key=access_key,
        secret_key=secret_key,
        session_token=session_token,
        profile_name=profile_name,
    )

    # Then
    assert aws.region == region
    assert aws.access_key == access_key
    assert aws.secret_key == secret_key
    assert aws.session_token == session_token
    assert aws.profile_name == profile_name


def test_waldiez_model_aws_serialization() -> None:
    """Test WaldiezModelAWS serialization."""
    # Given
    aws = WaldiezModelAWS(
        region="us-east-1",
        access_key="test_access_key",  # nosemgrep # nosec
        secret_key="test_secret_key",  # nosemgrep # nosec
        session_token="test_session_token",  # nosemgrep # nosec
        profile_name="test_profile",
    )

    # When
    serialized = aws.model_dump()

    # Then
    assert serialized["region"] == "us-east-1"
    assert serialized["accessKey"] == "test_access_key"  # nosemgrep # nosec
    assert serialized["secretKey"] == "test_secret_key"  # nosemgrep # nosec
    assert (
        serialized["sessionToken"] == "test_session_token"
    )  # nosemgrep # nosec
    assert serialized["profileName"] == "test_profile"


def test_waldiez_model_aws_deserialization() -> None:
    """Test WaldiezModelAWS deserialization."""
    # Given
    data = {
        "region": "eu-west-1",
        "accessKey": "deserialized_access_key",  # nosemgrep # nosec
        "secretKey": "deserialized_secret_key",  # nosemgrep # nosec
        "sessionToken": "deserialized_session_token",  # nosemgrep # nosec
        "profileName": "deserialized_profile",
    }

    # When
    aws = WaldiezModelAWS.model_validate(data)

    # Then
    assert aws.region == "eu-west-1"
    assert aws.access_key == "deserialized_access_key"  # nosemgrep # nosec
    assert aws.secret_key == "deserialized_secret_key"  # nosemgrep # nosec
    assert (
        aws.session_token == "deserialized_session_token"  # nosemgrep # nosec
    )
    assert aws.profile_name == "deserialized_profile"


def test_waldiez_model_aws_partial_data() -> None:
    """Test WaldiezModelAWS with partial data."""
    # Given/When
    aws = WaldiezModelAWS(region="ap-southeast-1", profile_name="production")

    # Then
    assert aws.region == "ap-southeast-1"
    assert aws.profile_name == "production"
    assert aws.access_key is None
    assert aws.secret_key is None
    assert aws.session_token is None


def test_waldiez_model_aws_empty_strings() -> None:
    """Test WaldiezModelAWS with empty strings."""
    # Given/When
    aws = WaldiezModelAWS(
        region="",
        access_key="",  # nosemgrep # nosec
        secret_key="",  # nosemgrep # nosec
        session_token="",  # nosemgrep # nosec
        profile_name="",
    )

    # Then
    assert aws.region == ""
    assert aws.access_key == ""  # nosemgrep # nosec
    assert aws.secret_key == ""  # nosemgrep # nosec
    assert aws.session_token == ""  # nosemgrep # nosec
    assert aws.profile_name == ""


def test_waldiez_model_aws_model_dump_exclude_none() -> None:
    """Test WaldiezModelAWS model_dump with exclude_none."""
    # Given
    aws = WaldiezModelAWS(
        region="us-west-1",
        access_key="test_key",  # nosemgrep # nosec
    )

    # When
    serialized = aws.model_dump(exclude_none=True)

    # Then
    assert "region" in serialized
    assert "accessKey" in serialized
    assert "secretKey" not in serialized
    assert "sessionToken" not in serialized
    assert "profileName" not in serialized
