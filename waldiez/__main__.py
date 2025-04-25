# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Waldiez entrypoint when called as a module."""

from .cli import app

if __name__ == "__main__":
    app()
