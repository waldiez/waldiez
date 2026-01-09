# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.
"""Test waldiez.models.common.now."""

from waldiez.models.common import now


def test_now() -> None:
    """Test now()."""
    # When
    result = now()
    # Then
    assert result
    assert len(result) == 24
    assert result[4] == "-"
    assert result[7] == "-"
    assert result[10] == "T"
    assert result[13] == ":"
    assert result[16] == ":"
    assert result[19] == "."
    assert result[23] == "Z"
    assert result[0:4].isdigit()
    assert result[5:7].isdigit()
    assert result[8:10].isdigit()
    assert result[11:13].isdigit()
    assert result[14:16].isdigit()
    assert result[17:19].isdigit()
    assert result[20:23].isdigit()
