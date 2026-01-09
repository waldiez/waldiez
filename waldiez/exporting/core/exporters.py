# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2026 Waldiez and contributors.

"""Exporters for Waldiez."""

from typing import Any

from .exporter import Exporter
from .types import Extras


class SimpleExporter(Exporter[None]):
    """Simple exporter that doesn't use extras system."""

    def generate_main_content(self) -> str | None:
        """Generate main content for the exporter.

        Returns
        -------
        str | None
            The main content as a string or None if not applicable.
        """
        raise NotImplementedError("Subclasses must implement this method.")

    @property
    def extras(self) -> None:
        """Simple exporters don't have extras."""
        return None

    def _add_additional_content(self) -> None:
        """Override this for custom content in simple exporters."""


class ConfigurableExporter(Exporter[Extras]):
    """Exporter with configuration support."""

    @property
    def extras(self) -> Extras:
        """Get the extras for this exporter.

        Returns
        -------
        Extras
            The extras associated with this exporter.

        Raises
        ------
        NotImplementedError
            If the method is not implemented in a subclass.
        """
        raise NotImplementedError("Subclasses must implement this method.")

    def __init__(self, config: dict[str, Any] | None = None, **kwargs: Any):
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

    def generate_main_content(self) -> str | None:
        """Generate main content for the exporter.

        Returns
        -------
        str | None
            The main content as a string or None if not applicable.
        """
        raise NotImplementedError("Subclasses must implement this method.")

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
