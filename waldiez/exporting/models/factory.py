# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Factory function for creating a ModelsExporter instance."""

from pathlib import Path
from typing import Optional, Union

from waldiez.models import WaldiezAgent, WaldiezModel

from ..core import ExporterContext, get_default_exporter_context
from .exporter import ModelsExporter


def create_models_exporter(
    # Factory function for models exporter creation
    flow_name: str,
    agents: list[WaldiezAgent],
    agent_names: dict[str, str],
    models: list[WaldiezModel],
    model_names: dict[str, str],
    for_notebook: bool = False,
    cache_seed: Optional[int] = None,
    output_dir: Optional[Union[str, Path]] = None,
    context: Optional[ExporterContext] = None,
) -> ModelsExporter:
    """Create a models exporter.

    Parameters
    ----------
    flow_name : str
        The name of the flow.
    agents : list[WaldiezAgent]
        The agents that use models.
    agent_names : dict[str, str]
        Mapping of agent IDs to names.
    models : list[WaldiezModel]
        The models to export.
    model_names : dict[str, str]
        Mapping of model IDs to names.
    for_notebook : bool, optional
        Whether the export is for a notebook, by default False
    cache_seed : Optional[int], optional
        The cache seed if any, by default None
    output_dir : Optional[Union[str, Path]], optional
        Output directory for generated files, by default None
    context : Optional[ExporterContext], optional
        Exporter context with dependencies, by default None

    Returns
    -------
    ModelsExporter
        The created models exporter.
    """
    if context is None:
        context = get_default_exporter_context()
    return ModelsExporter(
        flow_name=flow_name,
        agents=agents,
        agent_names=agent_names,
        models=models,
        model_names=model_names,
        for_notebook=for_notebook,
        cache_seed=cache_seed,
        output_dir=output_dir,
        context=context,
    )
