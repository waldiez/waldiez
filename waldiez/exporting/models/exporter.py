# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Models exporter module."""

from pathlib import Path
from typing import Any

from waldiez.models import WaldiezAgent, WaldiezModel

from ..core import (
    AgentPosition,
    ContentOrder,
    DefaultSerializer,
    Exporter,
    ExporterContext,
    ExportPosition,
    ModelExtras,
    get_comment,
)
from .processor import ModelProcessor


class ModelsExporter(Exporter[ModelExtras]):
    """Mdels exporter with structured extras."""

    def __init__(
        self,
        flow_name: str,
        agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        models: list[WaldiezModel],
        model_names: dict[str, str],
        for_notebook: bool = False,
        cache_seed: int | None = None,
        output_dir: str | Path | None = None,
        context: ExporterContext | None = None,
        **kwargs: Any,
    ):
        """Initialize the models exporter."""
        super().__init__(context, **kwargs)

        self.flow_name = flow_name
        self.agents = agents
        self.agent_names = agent_names
        self.models = models
        self.model_names = model_names
        self.for_notebook = for_notebook
        self.cache_seed = cache_seed
        self.output_dir = Path(output_dir) if output_dir else None

        # Initialize extras with processed model content
        self._extras = self._create_model_extras()

    @property
    def extras(self) -> ModelExtras:
        """Get the model extras."""
        return self._extras

    def _create_model_extras(self) -> ModelExtras:
        """Create and populate model extras."""
        extras = ModelExtras("models")

        # Process models to generate LLM configs
        model_processor = ModelProcessor(
            flow_name=self.flow_name,
            models=self.models,
            model_names=self.model_names,
            serializer=(
                self.context.serializer
                if self.context.serializer
                else DefaultSerializer()
            ),
            output_dir=self.output_dir,
        )

        llm_configs_content = model_processor.process()

        # Set LLM config content
        if llm_configs_content:
            extras.set_llm_config({"content": llm_configs_content})
            self.add_content(
                llm_configs_content,
                ExportPosition.MODELS,
                order=ContentOrder.MAIN_CONTENT,
            )
        # Add environment variables for API keys
        for model in self.models:
            if model.api_key:
                self.add_env_var(
                    model.api_key_env_key,
                    model.api_key,
                    f"API key for {self.model_names[model.id]} model",
                )

        return extras

    def generate_main_content(self) -> str | None:
        """Generate the main models content (LLM configs).

        Returns
        -------
        Optional[str]
            The main content string, or None if no content is available.
        """
        # handled in extras._contribute_specific_content(...)
        # also here for direct access
        if self.extras.has_specific_content():
            return self.extras.get_content()
        return None

    def _add_additional_content(self) -> None:
        """Add model related additional content."""
        if self.output_dir is not None:
            # Add API key loader script if output directory is set
            api_key_loader_script = self.get_api_key_loader_script()
            self.add_content(
                api_key_loader_script,
                ExportPosition.IMPORTS,
                order=ContentOrder.LATE_CLEANUP,
                skip_strip=True,
            )
        for agent in self.agents:
            llm_config_arg = self.get_agent_llm_config_arg(agent)
            if llm_config_arg:
                # Position as agent argument
                self.add_content(
                    llm_config_arg,
                    ExportPosition.AGENTS,
                    order=ContentOrder.MAIN_CONTENT,
                    agent_id=agent.id,
                    agent_position=AgentPosition.AS_ARGUMENT,
                )

    def get_agent_llm_config_arg(self, agent: WaldiezAgent) -> str:
        """Get LLM config argument for agent.

        Parameters
        ----------
        agent : WaldiezAgent
            The agent for which to get the LLM config argument.

        Returns
        -------
        str
            The LLM config argument string for the agent,
            or "llm_config=False" if no models are configured.
        """
        if not agent.data.model_ids:
            return "    llm_config=False,  # pyright: ignore\n"

        # Get model configs for this agent
        model_configs: list[str] = []
        for model_id in agent.data.model_ids:
            model_name = self.model_names.get(model_id)
            if model_name:
                model_configs.append(f"{model_name}_llm_config")
        tab: str = " " * 4
        if not model_configs:
            return f"{tab}llm_config=False, # pyright: ignore\n"

        config_list = f",\n{tab}{tab}{tab}".join(model_configs)
        llm_config = f"""{tab}llm_config=autogen.LLMConfig(
        config_list=[
            {config_list},
        ]"""
        #
        # Add cache seed if provided
        if self.cache_seed is not None:
            llm_config += f",\n{tab}{tab}cache_seed={self.cache_seed},\n"
        else:
            llm_config += f",\n{tab}{tab}cache_seed=None,\n"
        llm_config += f"{tab}),\n"

        return llm_config

    def get_api_key_loader_script(self) -> str:
        """Get the api key loader script.

        Returns
        -------
        str
            The api key loader script.
        """
        comment = get_comment(
            "Load model API keys",
            for_notebook=self.config.for_notebook,
        )
        loader_script = f'''{comment}# NOTE:
# This section assumes that a file named:
# "{self.flow_name}_api_keys.py"
# exists in the same directory as this file.
# This file contains the API keys for the models used in this flow.
# It should be .gitignored and not shared publicly.
# If this file is not present, you can either create it manually
# or change the way API keys are loaded in the flow.


def load_api_key_module(flow_name: str) -> ModuleType:
    """Load the api key module.

    Parameters
    ----------
    flow_name : str
        The flow name.

    Returns
    -------
    ModuleType
        The api keys loading module.
    """
    module_name = f"{{flow_name}}_api_keys"
    if module_name in sys.modules:
        return importlib.reload(sys.modules[module_name])
    return importlib.import_module(module_name)

__MODELS_MODULE__ = load_api_key_module("{self.flow_name}")


def get_{self.flow_name}_model_api_key(model_name: str) -> str:
    """Get the model api key.
    Parameters
    ----------
    model_name : str
        The model name.

    Returns
    -------
    str
        The model api key.
    """
    return __MODELS_MODULE__.get_{self.flow_name}_model_api_key(model_name)

'''
        return loader_script
