# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Entry point for the package if executed as a module."""
from .cli import app

__all__ = ["app"]

if __name__ == "__main__":
    app()
