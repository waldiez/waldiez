# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Singleton context for exporters."""

import threading
from dataclasses import dataclass
from typing import Any, Optional

from waldiez.logger import WaldiezLogger

from .extras.path_resolver import DefaultPathResolver
from .extras.serializer import DefaultSerializer
from .protocols import ExportingLogger, PathResolver, Serializer, Validator
from .types import ExportConfig


@dataclass
class ExporterContext:
    """Context object containing common exporter dependencies."""

    serializer: Optional[Serializer] = None
    path_resolver: Optional[PathResolver] = None
    validator: Optional[Validator] = None
    config: Optional[ExportConfig] = None
    logger: Optional[ExportingLogger] = None

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
        name: Optional[str] = None,
        description: Optional[str] = None,
        requirements: Optional[list[str]] = None,
        tags: Optional[list[str]] = None,
        output_extension: Optional[str] = None,
        is_async: bool = False,
        output_directory: Optional[str] = None,
        cache_seed: Optional[int] = None,
    ) -> ExportConfig:
        """Get export config or return default.

        Parameters
        ----------
        name : Optional[str], optional
            The name of the export, by default None
        description : Optional[str], optional
            A brief description of the export, by default None
        requirements : Optional[list[str]], optional
            A list of requirements for the export, by default None
        tags : Optional[list[str]], optional
            A list of tags associated with the export, by default None
        output_extension : Optional[str], optional
            The file extension for the output, by default None
        is_async : bool, optional
            Whether the export is asynchronous, by default False
        output_directory : Optional[str], optional
            The directory where the output will be saved, by default None
        cache_seed : Optional[int], optional
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

    def get_logger(self) -> ExportingLogger:
        """Get logger or create a default one.

        Returns
        -------
        ExportingLogger
            The logger instance.
        """
        return self.logger or WaldiezLogger()


# pylint: disable=too-few-public-methods
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
        serializer: Optional[Serializer] = None,
        validator: Optional[Validator] = None,
        path_resolver: Optional[PathResolver] = None,
        logger: Optional[ExportingLogger] = None,
        config: Optional[ExportConfig] = None,
    ) -> None:
        if hasattr(self, "_initialized"):
            return
        super().__init__(
            serializer=serializer or DefaultSerializer(),
            path_resolver=path_resolver or DefaultPathResolver(),
            logger=logger or WaldiezLogger(),
            validator=validator,
            config=config,
        )
        self._initialized = True


def get_default_exporter_context(
    config: Optional[ExportConfig] = None,
    logger: Optional[ExportingLogger] = None,
) -> ExporterContext:
    """Get the default exporter context.

    Parameters
    ----------
    config : Optional[ExportConfig], optional
        The export configuration, by default None
    logger : Optional[ExportingLogger], optional
        The logger instance, by default None

    Returns
    -------
    ExporterContext
        The default exporter context.
    """
    return DefaultExporterContext(
        serializer=DefaultSerializer(),
        path_resolver=DefaultPathResolver(),
        logger=logger or WaldiezLogger(),
        config=config,
    )


def create_exporter_context(
    serializer: Optional[Serializer] = None,
    validator: Optional[Validator] = None,
    path_resolver: Optional[PathResolver] = None,
    config: Optional[ExportConfig] = None,
    logger: Optional[ExportingLogger] = None,
) -> ExporterContext:
    """Create an exporter context with the given components.

    Parameters
    ----------
    serializer : Optional[Serializer], optional
        The serializer component, by default None
    path_resolver : Optional[PathResolver], optional
        The path resolver component, by default None
    validator : Optional[Validator], optional
        The validator component, by default None
    config : Optional[ExportConfig], optional
        The export configuration, by default None
    logger : Optional[ExportingLogger], optional
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
        logger=logger or WaldiezLogger(),
        config=config,
    )
