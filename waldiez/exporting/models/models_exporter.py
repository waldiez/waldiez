# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.
"""Export models (llm_configs)."""

from pathlib import Path
from typing import Optional, Tuple, Union

from waldiez.models import WaldiezAgent, WaldiezModel

from ..base import (
    AgentPosition,
    AgentPositions,
    BaseExporter,
    ExporterMixin,
    ExporterReturnType,
    ExportPosition,
)
from .utils import export_models, get_agent_llm_config_arg


class ModelsExporter(BaseExporter, ExporterMixin):
    """Models exporter."""

    _exported_string: Optional[str]

    def __init__(
        self,
        flow_name: str,
        agents: list[WaldiezAgent],
        agent_names: dict[str, str],
        models: list[WaldiezModel],
        model_names: dict[str, str],
        for_notebook: bool,
        cache_seed: Optional[int],
        output_dir: Optional[Union[str, Path]] = None,
    ) -> None:
        """Initialize the models exporter.

        Parameters
        ----------
        agents : list[WaldiezAgent]
            The agents.
        agent_names : dict[str, str]
            The agent names.
        models : list[WaldiezModel]
            The models.
        model_names : dict[str, str]
            The model names.
        for_notebook : bool
            Whether the export is for a notebook or not.
        cache_seed : Optional[int]
            The cache seed if any, by default None
        output_dir : Optional[Union[str, Path]], optional
            The output directory if any, by default None
        """
        self.for_notebook = for_notebook
        self.flow_name = flow_name
        self.agents = agents
        self.agent_names = agent_names
        self.models = models
        self.model_names = model_names
        if output_dir is not None and not isinstance(output_dir, Path):
            output_dir = Path(output_dir)
        self.cache_seed = cache_seed
        self.output_dir = output_dir
        self._exported_string = None

    def get_imports(self) -> None:
        """Generate the imports string."""
        if not self.output_dir:
            return None
        file_path = self.output_dir / f"{self.flow_name}_api_keys.py"
        if not file_path.exists():
            # might be because the models are not exported yet
            if not self._exported_string:
                self.generate()
        return None

    def get_after_export(
        self,
    ) -> Optional[list[Tuple[str, Union[ExportPosition, AgentPosition]]]]:
        # fmt: off
        """Generate the after export strings.

        The arguments for the agent's initialization.
        example generated args:
        >>> agent1 = ConversableAgent(
        >>>     ...
        >>>     llm_config=False,
        >>>     ...
        >>> )

        >>> agent2 = ConversableAgent(
        >>>     ...
        >>>     llm_config={
        >>>         "config_list": [
        >>>             model1_llm_config,
        >>>             model2_llm_config,
        >>>         ],
        >>>     },
        >>>     ...
        >>> )

        where `model1_llm_config` and `model2_llm_config`
        are the exported models using `self.generate()`

        Returns
        -------
        Optional[list[Tuple[str, Union[ExportPosition, AgentPosition]]]]
            The exported after export strings and their positions.
        """
        # fmt: on
        agent_llm_config_args: list[
            Tuple[str, Union[ExportPosition, AgentPosition]]
        ] = []
        for agent in self.agents:
            agent_llm_config_args.append(
                (
                    get_agent_llm_config_arg(
                        agent,
                        all_models=self.models,
                        model_names=self.model_names,
                        cache_seed=self.cache_seed,
                    ),
                    AgentPosition(
                        agent=agent, position=AgentPositions.AS_ARGUMENT
                    ),
                )
            )
        return agent_llm_config_args

    def generate(self) -> str:
        """Export the models.

        Returns
        -------
        str
            The exported models.
        """
        if not self._exported_string:  # pragma: no cover
            self._exported_string = export_models(
                flow_name=self.flow_name,
                all_models=self.models,
                model_names=self.model_names,
                output_dir=self.output_dir,
                serializer=self.serializer,
            )
            self.get_imports()
        return self._exported_string

    def get_environment_variables(self) -> Optional[list[Tuple[str, str]]]:
        """Get the environment variables to set.

        Returns
        -------
        Optional[list[Tuple[str, str]]
            The environment variables to set.
        """
        env_vars = []
        for model in self.models:
            if model.api_key:
                env_vars.append((model.api_key_env_key, model.api_key))
        return env_vars

    @staticmethod
    def get_api_key_loader_script(flow_name: str) -> str:
        """Get the api key loader script.

        Parameters
        ----------
        flow_name : str
            The flow name.

        Returns
        -------
        str
            The api key loader script.
        """
        loader_script = f'''
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

__MODELS_MODULE__ = load_api_key_module("{flow_name}")


def get_{flow_name}_model_api_key(model_name: str) -> str:
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
    return __MODELS_MODULE__.get_{flow_name}_model_api_key(model_name)
'''
        return loader_script

    def export(self) -> ExporterReturnType:
        """Export the models.

        Returns
        -------
        ExporterReturnType
            The exported models,
            the imports,
            the before export strings,
            the after export strings,
            and the environment variables.
        """
        exported_string = self.generate()
        after_export = self.get_after_export()
        result: ExporterReturnType = {
            "content": exported_string,
            "imports": [],
            "before_export": None,
            "after_export": after_export,
            "environment_variables": self.get_environment_variables(),
        }
        return result
