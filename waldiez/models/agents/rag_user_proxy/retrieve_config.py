# SPDX-License-Identifier: Apache-2.0.
# Copyright (c) 2024 - 2025 Waldiez and contributors.

# pylint: disable=invalid-name
# pyright: reportArgumentType=false

"""RAG user agent retrieve config."""

import os
from pathlib import Path

from pydantic import Field, model_validator
from typing_extensions import Annotated, Literal, Self

from ...common import WaldiezBase, check_function, generate_function
from .vector_db_config import WaldiezRagUserProxyVectorDbConfig

WaldiezRagUserProxyTask = Literal["code", "qa", "default"]
"""Possible tasks for the retrieve chat."""
WaldiezRagUserProxyVectorDb = Literal["chroma", "pgvector", "mongodb", "qdrant"]
"""Possible vector dbs for the retrieve chat."""
WaldiezRagUserProxyChunkMode = Literal["multi_lines", "one_line"]
"""Possible chunk modes for the retrieve chat."""
WaldiezRagUserProxyModels: dict[WaldiezRagUserProxyVectorDb, str] = {
    "chroma": "all-MiniLM-L6-v2",
    "mongodb": "all-MiniLM-L6-v2",
    "pgvector": "all-MiniLM-L6-v2",
    "qdrant": "BAAI/bge-small-en-v1.5",
}

CUSTOM_EMBEDDING_FUNCTION = "custom_embedding_function"
CUSTOM_EMBEDDING_FUNCTION_ARGS: list[str] = []
CUSTOM_EMBEDDING_FUNCTION_TYPES: tuple[list[str], str] = (
    [],
    "Callable[..., Any]",
)
CUSTOM_TOKEN_COUNT_FUNCTION = "custom_token_count_function"  # nosec
CUSTOM_TOKEN_COUNT_FUNCTION_ARGS = ["text", "model"]  # nosec
CUSTOM_TOKEN_COUNT_FUNCTION_TYPES = (
    ["str", "str"],
    "int",
)

CUSTOM_TEXT_SPLIT_FUNCTION = "custom_text_split_function"
CUSTOM_TEXT_SPLIT_FUNCTION_ARGS = [
    "text",
    "max_tokens",
    "chunk_mode",
    "must_break_at_empty_line",
    "overlap",
]
CUSTOM_TEXT_SPLIT_FUNCTION_TYPES = (
    ["str", "int", "str", "bool", "int"],
    "list[str]",
)
# noinspection HttpUrlsUsage
NOT_LOCAL = (
    "http://",
    "https://",
    "ftp://",
    "ftps://",
    "sftp://",
    "hdfs",
    "s3://",
    "gs://",
    "azure://",
)


class WaldiezRagUserProxyRetrieveConfig(WaldiezBase):
    """RAG user agent.

    Attributes
    ----------
    task : Literal["code", "qa", "default"]
        The task of the retrieve chat.
        Possible values are 'code', 'qa' and 'default'.
        System prompt will be different for different tasks.
        The default value is default, which supports both code and qa,
        and provides source information in the end of the response.
    vector_db : Literal["chroma", "pgvector", "mongodb", "qdrant"]
        The vector db for the retrieve chat.
    db_config : Annotated[WaldiezVectorDbConfig, Field]
        The config for the selected vector db.
    docs_path : Optional[Union[str, list[str]]]
        The path to the docs directory. It can also be the path to a single
        file, the url to a single file or a list of directories, files and
        urls. Default is None, which works only if the collection is already
        created.
    new_docs : bool
        When True, only adds new documents to the collection; when False,
        updates existing documents and adds new ones. Default is True.
        Document id is used to determine if a document is new or existing.
        By default, the id is the hash value of the content.
    model : str | None
        The model to use for the retrieve chat. If key not provided, a default
        model gpt-4 will be used.
    chunk_token_size : Optional[int]
        The chunk token size for the retrieve chat. If key not provided, a
        default size max_tokens * 0.4 will be used.
    context_max_tokens : Optional[int]
        The context max token size for the retrieve chat. If key not provided,
        a default size max_tokens * 0.8 will be used.
    chunk_mode : str | None
        The chunk mode for the retrieve chat. Possible values are 'multi_lines'
        and 'one_line'. If key not provided, a default mode multi_lines will be
        used.
    must_break_at_empty_line : bool
        Chunk will only break at empty line if True. Default is True. If
        chunk_mode is 'one_line', this parameter will be ignored.
    use_custom_embedding: bool
        Whether to use custom embedding for the retrieve chat. Default is False.
        If True, the embedding_function should be provided.
    embedding_function : str | None
        The embedding function for creating the vector db. Default is None,
        SentenceTransformer with the given embedding_model will be used. If
        you want to use OpenAI, Cohere, HuggingFace or other embedding
        functions, you can pass it here, follow the examples in
        https://docs.trychroma.com/guides/embeddings.
    customized_prompt : str | None
        The customized prompt for the retrieve chat. Default is None.
    customized_answer_prefix : str | None
        The customized answer prefix for the retrieve chat. Default is ''. If
        not '' and the customized_answer_prefix is not in the answer, Update
        Context will be triggered.
    update_context : bool
        If False, will not apply Update Context for interactive retrieval.
        Default is True.
    collection_name : str | None
        The name of the collection. If key not provided, a default name
        autogen-docs will be used.
    get_or_create : bool
        Whether to get the collection if it exists. Default is False.
    overwrite : bool
        Whether to overwrite the collection if it exists. Default is False.
        Case 1. if the collection does not exist, create the collection. Case
        2. the collection exists, if overwrite is True, it will overwrite the
        collection. Case 3. the collection exists and overwrite is False, if
        get_or_create is True, it will get the collection, otherwise it raise a
        ValueError.
    use_custom_token_count: bool
        Whether to use custom token count function for the retrieve chat.
        Default is False. If True, the custom_token_count_function should be
        provided.
    custom_token_count_function : str | None
        A custom function to count the number of tokens in a string. The
        function should take (text:str, model:str) as input and return the
        token_count(int). the retrieve_config['model'] will be passed in the
        function. Default is autogen.token_count_utils.count_token that uses
        tiktoken, which may not be accurate for non-OpenAI models.
    use_custom_text_split: bool
        Whether to use custom text split function for the retrieve chat. Default
        is False. If True, the custom_text_split_function should be provided.
    custom_text_split_function : str | None
        A custom function to split a string into a list of strings. Default is
        None, will use the default function in autogen.retrieve_utils.
        split_text_to_chunks.
    custom_text_types : Optional[list[str]]
        A list of file types to be processed. Default is autogen.retrieve_utils.
        TEXT_FORMATS. This only applies to files under the directories in
        docs_path. Explicitly included files and urls will be chunked
        regardless of their types.
    recursive : bool
        Whether to search documents recursively in the docs_path. Default is
        True.
    distance_threshold : float
        The threshold for the distance score, only distance smaller than it
        will be returned. Will be ignored if < 0. Default is -1.
    n_results: Optional[int]
        The number of results to return. Default is None, which will return all
    """

    task: Annotated[
        WaldiezRagUserProxyTask,
        Field(
            default="default",
            title="Task",
            description=(
                "The task of the retrieve chat. "
                "Possible values are 'code', 'qa' and 'default'. "
                "System prompt will be different for different tasks. "
                "The default value is default, which supports both code, "
                "and qa and provides source information in the end of "
                "the response."
            ),
        ),
    ]
    vector_db: Annotated[
        WaldiezRagUserProxyVectorDb,
        Field(
            default="chroma",
            title="Vector DB",
            description="The vector db for the retrieve chat.",
        ),
    ]
    db_config: Annotated[
        WaldiezRagUserProxyVectorDbConfig,
        Field(
            title="DB Config",
            description="The config for the selected vector db.",
            default_factory=WaldiezRagUserProxyVectorDbConfig,
        ),
    ]
    docs_path: Annotated[
        str | list[str] | None,
        Field(
            default=None,
            title="Docs Path",
            description=(
                "The path to the docs directory. It can also be the path to "
                "a single file, the url to a single file or a list of "
                "directories, files and urls. Default is None, which works "
                "only if the collection is already created."
            ),
        ),
    ]
    new_docs: Annotated[
        bool,
        Field(
            default=True,
            title="New Docs",
            description=(
                "When True, only adds new documents to the collection; "
                "when False, updates existing documents and adds new ones. "
                "Default is True. Document id is used to determine if a "
                "document is new or existing. By default, the id is the "
                "hash value of the content."
            ),
        ),
    ]
    model: Annotated[
        str | None,
        Field(
            default=None,
            title="Model",
            description=(
                "The model to use for the retrieve chat. If key not provided, "
                "we check for models linked to the agent."
            ),
        ),
    ]
    chunk_token_size: Annotated[
        int | None,
        Field(
            default=None,
            title="Chunk Token Size",
            description=(
                "The chunk token size for the retrieve chat.  "
                "If key not provided, a default size max_tokens * 0.4 "
                "will be used."
            ),
        ),
    ]
    context_max_tokens: Annotated[
        int | None,
        Field(
            default=None,
            title="Context Max Tokens",
            description=(
                "The context max token size for the retrieve chat. "
                "If key not provided, a default size max_tokens * 0.8 "
                "will be used."
            ),
        ),
    ]
    chunk_mode: Annotated[
        WaldiezRagUserProxyChunkMode,
        Field(
            default="multi_lines",
            title="Chunk Mode",
            description=(
                "The chunk mode for the retrieve chat. Possible values are "
                "'multi_lines' and 'one_line'. If key not provided, "
                "a default mode multi_lines will be used."
            ),
        ),
    ]
    must_break_at_empty_line: Annotated[
        bool,
        Field(
            default=True,
            title="Must Break at Empty Line",
            description=(
                "Chunk will only break at empty line if True. Default is True. "
                "If chunk_mode is 'one_line', this parameter will be ignored."
            ),
        ),
    ]
    use_custom_embedding: Annotated[
        bool,
        Field(
            default=False,
            title="Use Custom Embedding",
            description=(
                "Whether to use custom embedding for the retrieve chat. "
                "Default is False. If True, the embedding_function should be "
                "provided."
            ),
        ),
    ]
    embedding_function: Annotated[
        str | None,
        Field(
            default=None,
            title="Embedding Function",
            description=(
                "The embedding function for creating the vector db. "
                "Default is None, SentenceTransformer with the given "
                "embedding_model will be used. If you want to use OpenAI, "
                "Cohere, HuggingFace or other embedding functions, "
                "you can pass it here, follow the examples in "
                "https://docs.trychroma.com/guides/embeddings."
            ),
        ),
    ]
    customized_prompt: Annotated[
        str | None,
        Field(
            default=None,
            title="Customized Prompt",
            description=(
                "The customized prompt for the retrieve chat. Default is None."
            ),
        ),
    ]
    customized_answer_prefix: Annotated[
        str | None,
        Field(
            default="",
            title="Customized Answer Prefix",
            description=(
                "The customized answer prefix for the retrieve chat. "
                "Default is ''. If not '' and the customized_answer_prefix is "
                "not in the answer, Update Context will be triggered."
            ),
        ),
    ]
    update_context: Annotated[
        bool,
        Field(
            default=True,
            title="Update Context",
            description=(
                "If False, will not apply Update Context for interactive "
                "retrieval. Default is True."
            ),
        ),
    ]
    collection_name: Annotated[
        str,
        Field(
            default="autogen-docs",
            title="Collection Name",
            description=(
                "The name of the collection. If key not provided, "
                "a default name autogen-docs will be used."
            ),
        ),
    ]
    get_or_create: Annotated[
        bool,
        Field(
            default=False,
            title="Get or Create",
            description=(
                "Whether to get the collection if it exists. Default is False."
            ),
        ),
    ]
    overwrite: Annotated[
        bool,
        Field(
            default=False,
            title="Overwrite",
            description=(
                "Whether to overwrite the collection if it exists. "
                "Default is False. "
                "Case 1. if the collection does not exist,"
                " create the collection. "
                "Case 2. the collection exists, if overwrite is True,"
                " it will overwrite the collection. "
                "Case 3. the collection exists and overwrite is False, if"
                " get_or_create is True, it will get the collection,"
                " otherwise it raise a ValueError."
            ),
        ),
    ]
    use_custom_token_count: Annotated[
        bool,
        Field(
            default=False,
            title="Use Custom Token Count",
            description=(
                "Whether to use custom token count function for the retrieve "
                "chat. Default is False. If True, the "
                "custom_token_count_function should be provided."
            ),
        ),
    ]
    custom_token_count_function: Annotated[
        str | None,
        Field(
            default=None,
            title="Custom Token Count Function",
            description=(
                "A custom function to count the number of tokens in a string. "
                "The function should take (text:str, model:str) as input "
                "and return the token_count(int). the retrieve_config['model'] "
                "will be passed in the function. "
                "Default is autogen.token_count_utils.count_token that uses "
                "tiktoken, which may not be accurate for non-OpenAI models."
            ),
        ),
    ]
    use_custom_text_split: Annotated[
        bool,
        Field(
            default=False,
            title="Use Custom Text Split",
            description=(
                "Whether to use custom text split function for the retrieve "
                "chat. Default is False. If True, the "
                "custom_text_split_function should be provided."
            ),
        ),
    ]
    custom_text_split_function: Annotated[
        str | None,
        Field(
            default=None,
            title="Custom Text Split Function",
            description=(
                "A custom function to split a string into a list of strings. "
                "Default is None, will use the default function in "
                "autogen.retrieve_utils.split_text_to_chunks."
            ),
        ),
    ]
    custom_text_types: Annotated[
        list[str] | None,
        Field(
            default=None,
            title="Custom Text Types",
            description=(
                "A list of file types to be processed. "
                "Default is autogen.retrieve_utils.TEXT_FORMATS. "
                "This only applies to files under the directories in "
                "docs_path. Explicitly included files and urls will be "
                "chunked regardless of their types."
            ),
        ),
    ]
    recursive: Annotated[
        bool,
        Field(
            default=True,
            title="Recursive",
            description=(
                "Whether to search documents recursively in the docs_path. "
                "Default is True."
            ),
        ),
    ]
    distance_threshold: Annotated[
        float,
        Field(
            default=-1,
            title="Distance Threshold",
            description=(
                "The threshold for the distance score, only distance"
                " smaller than this will be returned. "
                "Will be ignored if < 0. Default is -1."
            ),
        ),
    ]
    n_results: Annotated[
        int | None,
        Field(
            default=None,
            title="Number of Results",
            description=(
                "The number of results to return. Default is None, "
                "which will return all."
                "Use None or <1 to return all results."
            ),
        ),
    ]
    _embedding_function_string: str | None = None

    _token_count_function_string: str | None = None

    _text_split_function_string: str | None = None

    @property
    def embedding_function_string(self) -> str | None:
        """Get the embedding function string.

        Returns
        -------
        str | None
            The embedding function string.
        """
        return self._embedding_function_string

    @property
    def token_count_function_string(self) -> str | None:
        """Get the token count function string.

        Returns
        -------
        str | None
            The token count function string.
        """
        return self._token_count_function_string

    @property
    def text_split_function_string(self) -> str | None:
        """Get the text split function string.

        Returns
        -------
        str | None
            The text split function string.
        """
        return self._text_split_function_string

    def get_custom_embedding_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Generate the custom embedding function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The custom embedding function and the function name.
        """
        function_name = CUSTOM_EMBEDDING_FUNCTION
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=CUSTOM_EMBEDDING_FUNCTION_ARGS,
                function_types=CUSTOM_EMBEDDING_FUNCTION_TYPES,
                function_body=self.embedding_function_string or "",
            ),
            function_name,
        )

    def get_custom_token_count_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Generate the custom token count function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The custom token count function and the function name.
        """
        function_name = CUSTOM_TOKEN_COUNT_FUNCTION
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=CUSTOM_TOKEN_COUNT_FUNCTION_ARGS,
                function_types=CUSTOM_TOKEN_COUNT_FUNCTION_TYPES,
                function_body=self.token_count_function_string or "",
            ),
            function_name,
        )

    def get_custom_text_split_function(
        self,
        name_prefix: str | None = None,
        name_suffix: str | None = None,
    ) -> tuple[str, str]:
        """Generate the custom text split function.

        Parameters
        ----------
        name_prefix : str
            The function name prefix.
        name_suffix : str
            The function name suffix.

        Returns
        -------
        tuple[str, str]
            The custom text split function and the function name.
        """
        function_name = CUSTOM_TEXT_SPLIT_FUNCTION
        if name_prefix:
            function_name = f"{name_prefix}_{function_name}"
        if name_suffix:
            function_name = f"{function_name}_{name_suffix}"
        return (
            generate_function(
                function_name=function_name,
                function_args=CUSTOM_TEXT_SPLIT_FUNCTION_ARGS,
                function_types=CUSTOM_TEXT_SPLIT_FUNCTION_TYPES,
                function_body=self.text_split_function_string or "",
            ),
            function_name,
        )

    def validate_custom_embedding_function(self) -> None:
        """Validate the custom embedding function.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if self.use_custom_embedding:
            if not self.embedding_function:
                msg = (
                    "The embedding_function is required "
                    "if use_custom_embedding is True."
                )
                raise ValueError(msg)
            valid, error_or_content = check_function(
                code_string=self.embedding_function,
                function_name=CUSTOM_EMBEDDING_FUNCTION,
                function_args=CUSTOM_EMBEDDING_FUNCTION_ARGS,
            )
            if not valid:
                raise ValueError(error_or_content)
            self._embedding_function_string = error_or_content

    def validate_custom_token_count_function(self) -> None:
        """Validate the custom token count function.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if self.use_custom_token_count:
            if not self.custom_token_count_function:
                msg = (
                    "The custom_token_count_function is required "
                    "if use_custom_token_count is True."
                )
                raise ValueError(msg)
            valid, error_or_content = check_function(
                code_string=self.custom_token_count_function,
                function_name=CUSTOM_TOKEN_COUNT_FUNCTION,
                function_args=CUSTOM_TOKEN_COUNT_FUNCTION_ARGS,
            )
            if not valid:
                raise ValueError(error_or_content)
            self._token_count_function_string = error_or_content

    def validate_custom_text_split_function(self) -> None:
        """Validate the custom text split function.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if self.use_custom_text_split:
            if not self.custom_text_split_function:
                msg = (
                    "The custom_text_split_function is required "
                    "if use_custom_text_split is True."
                )
                raise ValueError(msg)
            valid, error_or_content = check_function(
                code_string=self.custom_text_split_function,
                function_name=CUSTOM_TEXT_SPLIT_FUNCTION,
                function_args=CUSTOM_TEXT_SPLIT_FUNCTION_ARGS,
            )
            if not valid:
                raise ValueError(error_or_content)
            self._text_split_function_string = error_or_content

    def validate_docs_path(self) -> None:
        """Validate the docs path.

        Raises
        ------
        ValueError
            If the validation fails.
        """
        if not self.docs_path:
            return

        # Normalize to list
        doc_paths = (
            [self.docs_path]
            if isinstance(self.docs_path, str)
            else self.docs_path
        )

        validated_paths: list[str] = []

        for path in doc_paths:
            # Skip duplicates
            if path in validated_paths:
                continue

            # Check if it's a remote path
            is_remote = is_remote_path(path)
            if is_remote:
                # Remote paths: ensure proper raw string wrapping if needed
                content = extract_raw_string_content(path)
                validated_paths.append(f'r"{content}"')
                continue

            # Handle local paths
            # First remove any file:// scheme
            cleaned_path = remove_file_scheme(path)
            content = extract_raw_string_content(cleaned_path)

            # Determine if it's likely a folder
            is_folder = string_represents_folder(content)

            if is_folder:
                validated_paths.append(f'r"{content}"')
            else:
                # Files: resolve and validate existence
                try:
                    resolved_path = resolve_path(cleaned_path, must_exist=True)
                    validated_paths.append(resolved_path)
                except ValueError as e:
                    raise ValueError(f"Invalid file path '{path}': {e}") from e

        # remove dupes (but keep order)
        validated_paths = list(dict.fromkeys(validated_paths))
        self.docs_path = [path for path in validated_paths if path]

    @model_validator(mode="after")
    def validate_rag_user_data(self) -> Self:
        """Validate the RAG user data.

        Raises
        ------
        ValueError
            If the validation fails.

        Returns
        -------
        WaldiezRagUserProxyData
            The validated RAG user data.
        """
        self.validate_custom_embedding_function()
        self.validate_custom_token_count_function()
        self.validate_custom_text_split_function()
        self.validate_docs_path()
        if not self.db_config.model:
            self.db_config.model = WaldiezRagUserProxyModels[self.vector_db]
        if isinstance(self.n_results, int) and self.n_results < 1:
            self.n_results = None
        return self


def extract_raw_string_content(path: str) -> str:
    """Extract content from potential raw string formats.

    Parameters
    ----------
    path : str
        The path that might be wrapped in raw string format.

    Returns
    -------
    str
        The actual content of the path, without raw string formatting.
    """
    # Handle r"..." and r'...'
    if path.startswith(('r"', "r'")) and len(path) > 3:
        quote = path[1]
        if path.endswith(quote):
            return path[2:-1]
        # Handle malformed raw strings (missing end quote)
        return path[2:]
    return path


def string_represents_folder(path: str) -> bool:
    """Check if a string represents a folder.

    Parameters
    ----------
    path : str
        The string to check (does not need to exist).

    Returns
    -------
    bool
        True if the path is likely a folder, False if it's likely a file.
    """
    # Extract actual path content if wrapped
    content = extract_raw_string_content(path)

    # Explicit folder indicators
    if content.endswith(("/", "\\", os.path.sep)):
        return True

    # Check if it actually exists and is a directory
    try:
        if os.path.isdir(content):
            return True
    except (OSError, ValueError):  # pragma: no cover
        pass

    # Heuristic: no file extension likely means folder
    # return not os.path.splitext(content)[1]
    _, ext = os.path.splitext(path.rstrip("/\\"))
    return not ext


def is_remote_path(path: str) -> bool:
    """Check if a path is a remote path.

    Parameters
    ----------
    path : str
        The path to check.

    Returns
    -------
    tuple[bool, bool]
        If the path is a remote path and if it's a raw string.
    """
    content = extract_raw_string_content(path)
    for not_local in NOT_LOCAL:
        if content.startswith((not_local, f'r"{not_local}', f"r'{not_local}")):
            return True
    return False


def remove_file_scheme(path: str) -> str:
    """Remove the file:// scheme from a path.

    Parameters
    ----------
    path : str
        The path to remove the scheme from.

    Returns
    -------
    str
        The path without the scheme.
    """
    content = extract_raw_string_content(path)

    # Remove file:// prefix
    while content.startswith("file://"):
        content = content[len("file://") :]

    return f'r"{content}"'


def resolve_path(path: str, must_exist: bool) -> str:
    """Try to resolve a path.

    Parameters
    ----------
    path : str
        The path to resolve.
    must_exist : bool
        If the path must exist.

    Returns
    -------
    str
        The resolved path, potentially wrapped in raw string format.

    Raises
    ------
    ValueError
        If the path is not a valid local path.
    """
    # Extract the actual path content
    # if is_raw:
    path_content = extract_raw_string_content(path)
    # else:
    #     path_content = path

    # Handle JSON-escaped backslashes
    if "\\\\" in path_content:  # pragma: no cover
        path_content = path_content.replace("\\\\", "\\")
    # pylint: disable=too-many-try-statements
    try:
        # Try to resolve the path
        resolved = Path(path_content).resolve()

        if must_exist and not resolved.exists():
            raise ValueError(f"Path {path} does not exist.")

        return f'r"{resolved}"'

    except (
        OSError,
        UnicodeDecodeError,
        ValueError,
    ) as error:  # pragma: no cover
        # Fallback: try as raw string for Windows compatibility
        raw_version = f'r"{path_content}"'
        try:
            # Test if the path can be resolved when treated as raw
            resolved = Path(raw_version).resolve()
            if must_exist and not resolved.exists():
                raise ValueError(f"Path {path} does not exist.") from error
            return raw_version
        except Exception:
            raise ValueError(
                f"Path {path} is not a valid local path: {error}"
            ) from error
