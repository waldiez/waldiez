# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

"""Exporters for Waldiez."""

from typing import Any, Optional

from .__base__ import Exporter
from .types import Extras


class SimpleExporter(Exporter[None]):
    """Simple exporter that doesn't use extras system."""

    @property
    def extras(self) -> None:
        """Simple exporters don't have extras."""
        return None

    def _add_additional_content(self) -> None:
        """Override this for custom content in simple exporters."""


class ConfigurableExporter(Exporter[Extras]):
    """Exporter with configuration support."""

    def __init__(self, config: Optional[dict[str, Any]] = None, **kwargs: Any):
        """Initialize with configuration.

        Parameters
        ----------
        config : Optional[Dict[str, Any]], optional
            Configuration dictionary, by default None
        **kwargs : Any
            Additional keyword arguments.
        """
        super().__init__(**kwargs)
        self._config = config or {}

    def get_config_value(self, key: str, default: Any = None) -> Any:
        """Get a configuration value.

        Parameters
        ----------
        key : str
            The configuration key.
        default : Any, optional
            Default value if key not found, by default None

        Returns
        -------
        Any
            The configuration value or default.
        """
        return self._config.get(key, default)

    def set_config_value(self, key: str, value: Any) -> None:
        """Set a configuration value.

        Parameters
        ----------
        key : str
            The configuration key.
        value : Any
            The configuration value.
        """
        self._config[key] = value
