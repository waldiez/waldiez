/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { CheckboxInput, Collapsible, Editor } from "@waldiez/components";
import { useWaldiezAgentRagUserCustomFunctions } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/customFunctions/hooks";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

/**
 * Default template for custom embedding function
 */
export const DEFAULT_RAG_CUSTOM_EMBEDDING_FUNCTION = `"""Custom embedding function."""
# provide the function to embed the input text
# complete the \`custom_embedding_function\` below.
# Do not change the name of the function.
# See https://docs.trychroma.com/integrations for more information and examples.
# examples:
# def custom_embedding_function():
#    # type: () -> callable
#   import chromadb.utils.embedding_functions as embedding_functions
#   huggingface_ef = embedding_functions.HuggingFaceEmbeddingFunction(
#        api_key="YOUR_API_KEY",
#        model_name="sentence-transformers/all-MiniLM-L6-v2"
#   )
#   return huggingface_ef
#
# def custom_embedding_function():
#    # type: () -> callable
#    import chromadb.utils.embedding_functions as embedding_functions
#    openai_ef = embedding_functions.OpenAIEmbeddingFunction(
#       api_key="YOUR_API_KEY",
#       model_name="text-embedding-3-small"
#    )
#    return openai_ef
#
def custom_embedding_function():
    # type: () -> callable
    """Complete the custom embedding function."""
    ...
`;

/**
 * Default template for custom token count function
 */
export const DEFAULT_RAG_CUSTOM_TOKEN_COUNT_FUNCTION = `"""Custom function to count the number of tokens in a string.

The function should take (text:str, model:str) as input and return the
token_count(int). the retrieve_config["model"] will be passed in the function.
Default is autogen.token_count_utils.count_token that uses tiktoken, which may
not be accurate for non-OpenAI models.
"""
# provide the function to count the number of tokens in a string.
# complete the \`custom_token_count_function\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the token count.

# example:
# def custom_token_count_function(text, model):
#    # type: (Union[str, List, Dict], str) -> int
#    return len(text.split())
#
def custom_token_count_function(text, model):
    """Complete the custom token count function."""
    ...
`;

/**
 * Default template for custom text split function
 */
export const DEFAULT_RAG_CUSTOM_TEXT_SPLIT_FUNCTION = `"""Custom text split function.

A custom function to split a string into a list of strings. The default function is
'autogen.retrieve_utils.split_text_to_chunks'.
"""
# provide the function to split the text into chunks.
# complete the \`custom_text_split_function\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the list of strings.
# example:
# def custom_text_split_function(
#    text: str,
#    max_tokens: int = 4000,
#    chunk_mode: str = "multi_lines",
#    must_break_at_empty_line: bool = True,
#    overlap: int = 0,  # number of overlapping lines
# ) -> list[str]:
#    return text.split("\\n")
#
def custom_text_split_function(
    text,  # type: str
    max_tokens,  # type: int
    chunk_mode,  # type: str (multi_lines or one_line)
    must_break_at_empty_line,  # type: bool
    overlap,  # type: int # number of overlapping lines
):
    # type: (...) -> list[str]
    """Complete the custom text split function."""
    ...
`;

type WaldiezAgentRagUserCustomFunctionsProps = {
    id: string;
    flowId: string;
    isDarkMode: boolean;
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
};

/**
 * Component for configuring custom functions for RAG
 * Handles embedding, token counting, and text splitting functions
 */
export const WaldiezAgentRagUserCustomFunctions = memo((props: WaldiezAgentRagUserCustomFunctionsProps) => {
    const { flowId, data, isDarkMode } = props;
    const { retrieveConfig } = data;

    // Use the hook for handlers
    const {
        onUseCustomEmbeddingChange,
        onEmbeddingFunctionChange,
        onUseCustomTokenCountChange,
        onCustomTokenCountFunctionChange,
        onUseCustomTextSplitChange,
        onCustomTextSplitFunctionChange,
    } = useWaldiezAgentRagUserCustomFunctions(props);

    /**
     * Current embedding function value
     */
    const embeddingFunctionValue = useMemo(
        () => retrieveConfig.embeddingFunction ?? DEFAULT_RAG_CUSTOM_EMBEDDING_FUNCTION,
        [retrieveConfig.embeddingFunction],
    );

    /**
     * Current token count function value
     */
    const tokenCountFunctionValue = useMemo(
        () => retrieveConfig.customTokenCountFunction ?? DEFAULT_RAG_CUSTOM_TOKEN_COUNT_FUNCTION,
        [retrieveConfig.customTokenCountFunction],
    );

    /**
     * Current text split function value
     */
    const textSplitFunctionValue = useMemo(
        () => retrieveConfig.customTextSplitFunction ?? DEFAULT_RAG_CUSTOM_TEXT_SPLIT_FUNCTION,
        [retrieveConfig.customTextSplitFunction],
    );

    /**
     * Determine if custom embedding is enabled
     */
    const useCustomEmbedding = retrieveConfig.useCustomEmbedding ?? false;

    /**
     * Determine if custom token count is enabled
     */
    const useCustomTokenCount = retrieveConfig.useCustomTokenCount ?? false;

    /**
     * Determine if custom text split is enabled
     */
    const useCustomTextSplit = retrieveConfig.useCustomTextSplit ?? false;

    /**
     * Common style for collapsible sections
     */
    const collapsibleStyle = { marginTop: -20, marginBottom: -10 };

    return (
        <div
            className="waldiez-agent-rag-user-custom-functions"
            data-testid={`rag-custom-functions-${flowId}`}
        >
            {/* Embedding Function Section */}
            <Collapsible
                title="Embedding Function"
                dataTestId={`${flowId}-rag-use-custom-embedding`}
                aria-label="Embedding function settings"
            >
                <div className="flex-column" style={collapsibleStyle}>
                    <div className="info">
                        <div className="info-tooltip">
                            If selected, the agent will use a custom embedding function. Default is False.
                        </div>
                    </div>
                    <CheckboxInput
                        id={`${flowId}-rag-use-custom-embedding-checkbox`}
                        label="Use Custom Embedding Function"
                        isChecked={useCustomEmbedding}
                        onCheckedChange={onUseCustomEmbeddingChange}
                        data-testid={`${flowId}-rag-use-custom-embedding-checkbox`}
                    />
                    {useCustomEmbedding && (
                        <>
                            <label htmlFor={`${flowId}-embedding-function-editor`}>Embedding Function:</label>
                            <div className="margin-top-10">
                                <Editor
                                    darkMode={isDarkMode}
                                    value={embeddingFunctionValue}
                                    onChange={onEmbeddingFunctionChange}
                                    aria-label="Custom embedding function code editor"
                                />
                            </div>
                        </>
                    )}
                </div>
            </Collapsible>

            {/* Token Count Section */}
            <Collapsible
                title="Token Count"
                dataTestId={`${flowId}-rag-use-custom-tokenCount`}
                aria-label="Token count function settings"
            >
                <div className="flex-column" style={collapsibleStyle}>
                    <div className="info">
                        <div className="info-tooltip">
                            If selected, the agent will use a custom token count function. Default is False.
                        </div>
                    </div>
                    <CheckboxInput
                        id={`${flowId}-rag-use-custom-tokenCount-checkbox`}
                        label="Use Custom Token Count Function"
                        isChecked={useCustomTokenCount}
                        onCheckedChange={onUseCustomTokenCountChange}
                        data-testid={`${flowId}-rag-use-custom-tokenCount-checkbox`}
                    />
                    {useCustomTokenCount && (
                        <>
                            <label htmlFor={`${flowId}-token-count-function-editor`}>
                                Custom Token Count Function:
                            </label>
                            <div className="margin-top-10">
                                <Editor
                                    darkMode={isDarkMode}
                                    value={tokenCountFunctionValue}
                                    onChange={onCustomTokenCountFunctionChange}
                                    aria-label="Custom token count function code editor"
                                />
                            </div>
                        </>
                    )}
                </div>
            </Collapsible>

            {/* Text Split Section */}
            <Collapsible
                title="Text Split"
                dataTestId={`${flowId}-rag-use-custom-textSplit`}
                aria-label="Text split function settings"
            >
                <div className="flex-column" style={collapsibleStyle}>
                    <div className="info">
                        <div className="info-tooltip">
                            If selected, the agent will use a custom text split function. Default is False.
                        </div>
                    </div>
                    <CheckboxInput
                        id={`${flowId}-rag-use-custom-textSplit-checkbox`}
                        label="Use Custom Text Split Function"
                        isChecked={useCustomTextSplit}
                        onCheckedChange={onUseCustomTextSplitChange}
                        data-testid={`${flowId}-rag-use-custom-textSplit-checkbox`}
                    />
                    {useCustomTextSplit && (
                        <>
                            <label htmlFor={`${flowId}-text-split-function-editor`}>
                                Custom Text Split Function:
                            </label>
                            <div className="margin-top-10">
                                <Editor
                                    darkMode={isDarkMode}
                                    value={textSplitFunctionValue}
                                    onChange={onCustomTextSplitFunctionChange}
                                    aria-label="Custom text split function code editor"
                                />
                            </div>
                        </>
                    )}
                </div>
            </Collapsible>
        </div>
    );
});

WaldiezAgentRagUserCustomFunctions.displayName = "WaldiezAgentRagUserCustomFunctions";
