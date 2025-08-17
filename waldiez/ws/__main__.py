# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Main entry point for Waldiez WebSocket server."""

import sys  # pragma: no cover
from pathlib import Path  # pragma: no cover

try:  # pragma: no cover
    from .cli import app
except ImportError:  # pragma: no cover
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from waldiez.ws.cli import app

if __name__ == "__main__":
    app()
