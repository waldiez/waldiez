# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
# flake8: noqa: E501
"""Waldiez Model AWS model."""

from typing import Optional

from pydantic import Field
from typing_extensions import Annotated

from ..common import WaldiezBase


class WaldiezModelAWS(WaldiezBase):
    """AWS related parameters.

    Attributes
    ----------
    region : Optional[str]
        The AWS region, by default None.
    access_key : Optional[str]
        The AWS access key, by default None.
    secret_key : Optional[str]
        The AWS secret access key, by default None.
    session_token : Optional[str]
        The AWS session token, by default None.
    profile_name : Optional[str]
        The AWS profile name, by default None.
    """

    region: Annotated[
        Optional[str],
        Field(
            None,
            alias="region",
            title="Region",
            description="The AWS region",
        ),
    ]
    access_key: Annotated[
        Optional[str],
        Field(
            None,
            alias="accessKey",
            title="Access Ke",
            description="The AWS access key",
        ),
    ]
    secret_key: Annotated[
        Optional[str],
        Field(
            None,
            alias="secretKey",
            title="Secret Key",
            description="The AWS secret key",
        ),
    ]
    session_token: Annotated[
        Optional[str],
        Field(
            None,
            alias="sessionToken",
            title="Session Token",
            description="The AWS session token",
        ),
    ]
    profile_name: Annotated[
        Optional[str],
        Field(
            None,
            alias="profileName",
            title="Profile Name",
            description="The AWS Profile name to use",
        ),
    ]
