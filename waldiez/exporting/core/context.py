# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Singleton context for exporters."""

import threading
from dataclasses import dataclass
from typing import Any, Optional

from waldiez.logger import WaldiezLogger, get_logger

from .extras.path_resolver import DefaultPathResolver
from .extras.serializer import DefaultSerializer
from .protocols import PathResolver, Serializer, Validator
from .types import ExportConfig


@dataclass
class ExporterContext:
    """Context object containing common exporter dependencies."""

    serializer: Serializer | None = None
    path_resolver: PathResolver | None = None
    validator: Validator | None = None
    config: ExportConfig | None = None
    logger: WaldiezLogger | None = None

    def get_serializer(self) -> Serializer:
        """Get serializer or raise if not set.

        Returns
        -------
        Serializer
            The serializer instance.
        """
        return self.serializer or DefaultSerializer()

    def get_path_resolver(self) -> PathResolver:
        """Get path resolver or return default.

        Returns
        -------
        PathResolver
            The path resolver instance.
        """
        return self.path_resolver or DefaultPathResolver()

    def get_config(
        self,
        name: str | None = None,
        description: str | None = None,
        requirements: list[str] | None = None,
        tags: list[str] | None = None,
        output_extension: str | None = None,
        is_async: bool = False,
        output_directory: str | None = None,
        cache_seed: int | None = None,
    ) -> ExportConfig:
        """Get export config or return default.

        Parameters
        ----------
        name : str], optional
            The name of the export, by default None
        description : str], optional
            A brief description of the export, by default None
        requirements : list[str]], optional
            A list of requirements for the export, by default None
        tags : list[str]], optional
            A list of tags associated with the export, by default None
        output_extension : str], optional
            The file extension for the output, by default None
        is_async : bool, optional
            Whether the export is asynchronous, by default False
        output_directory : str], optional
            The directory where the output will be saved, by default None
        cache_seed : int], optional
            The seed for caching, by default None

        Returns
        -------
        ExportConfig
            The export configuration.
        """
        kwargs: dict[str, Any] = {
            "requirements": requirements or [],
            "tags": tags or [],
            "is_async": self.config.is_async if self.config else is_async,
        }
        if output_extension is not None:
            kwargs["output_extension"] = output_extension
        if output_directory is not None:
            kwargs["output_directory"] = output_directory
        if cache_seed is not None:
            kwargs["cache_seed"] = cache_seed
        if name is not None:
            kwargs["name"] = name
        if description is not None:
            kwargs["description"] = description
        if self.config is not None:
            self.config.update(**kwargs)
        else:
            self.config = ExportConfig.create(**kwargs)
        return self.config

    def set_config(self, config: ExportConfig) -> None:
        """Set the export configuration.

        Parameters
        ----------
        config : ExportConfig
            The export configuration to set.
        """
        self.config = config

    def get_logger(self) -> WaldiezLogger:
        """Get logger or create a default one.

        Returns
        -------
        WaldiezLogger
            The logger instance.
        """
        return self.logger or get_logger()


# pylint: disable=too-few-public-methods
# noinspection PyUnresolvedReferences,PyTypeChecker
class DefaultExporterContext(ExporterContext):
    """Singleton context for exporters.

    Provides a default configuration with standard serializer and escaper.
    Access via get_default_exporter_context() for proper initialization.

    Note
    ----
    This is a singleton - only one instance exists per application.
    Direct instantiation may not behave as expected.
    """

    _instance: Optional["DefaultExporterContext"] = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "DefaultExporterContext":
        """Create a new instance of DefaultExporterContext.

        Parameters
        ----------
        cls : type
            The class type for which the instance is being created.
        *args : Any
            Positional arguments for the constructor.
        **kwargs : Any
            Keyword arguments for the constructor.

        Returns
        -------
        DefaultExporterContext
            The singleton instance of DefaultExporterContext.
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:  # Double-check
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(
        self,
        serializer: Serializer | None = None,
        validator: Validator | None = None,
        path_resolver: PathResolver | None = None,
        logger: WaldiezLogger | None = None,
        config: ExportConfig | None = None,
    ) -> None:
        if hasattr(self, "_initialized"):
            return
        super().__init__(
            serializer=serializer or DefaultSerializer(),
            path_resolver=path_resolver or DefaultPathResolver(),
            logger=logger or get_logger(),
            validator=validator,
            config=config,
        )
        self._initialized = True


def get_default_exporter_context(
    config: ExportConfig | None = None,
    logger: WaldiezLogger | None = None,
) -> ExporterContext:
    """Get the default exporter context.

    Parameters
    ----------
    config : ExportConfig | None, optional
        The export configuration, by default None
    logger : ExportingLogger | None, optional
        The logger instance, by default None

    Returns
    -------
    ExporterContext
        The default exporter context.
    """
    return DefaultExporterContext(
        serializer=DefaultSerializer(),
        path_resolver=DefaultPathResolver(),
        logger=logger or get_logger(),
        config=config,
    )


def create_exporter_context(
    serializer: Serializer | None = None,
    validator: Validator | None = None,
    path_resolver: PathResolver | None = None,
    config: ExportConfig | None = None,
    logger: WaldiezLogger | None = None,
) -> ExporterContext:
    """Create an exporter context with the given components.

    Parameters
    ----------
    serializer : Serializer | None, optional
        The serializer component, by default None
    path_resolver : PathResolver | None, optional
        The path resolver component, by default None
    validator : Validator | None, optional
        The validator component, by default None
    config : ExportConfig | None, optional
        The export configuration, by default None
    logger : WaldiezLogger | None, optional
        The logger instance, by default None

    Returns
    -------
    ExporterContext
        The created context.
    """
    return ExporterContext(
        serializer=serializer or DefaultSerializer(),
        path_resolver=path_resolver or DefaultPathResolver(),
        validator=validator,
        logger=logger or get_logger(),
        config=config,
    )
