/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Collapsible, Editor, InfoCheckbox } from "@waldiez/components";
import { useWaldiezAgentRagUserCustomFunctions } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/customFunctions/hooks";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

export const WaldiezAgentRagUserCustomFunctions = (props: {
    id: string;
    flowId: string;
    isDarkMode: boolean;
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
}) => {
    const {
        onUseCustomEmbeddingChange,
        onEmbeddingFunctionChange,
        onUseCustomTokenCountChange,
        onCustomTokenCountFunctionChange,
        onUseCustomTextSplitChange,
        onCustomTextSplitFunctionChange,
    } = useWaldiezAgentRagUserCustomFunctions(props);
    const { flowId, data, isDarkMode } = props;
    const { retrieveConfig } = data;
    return (
        <div className="waldiez-agent-rag-user-custom-functions">
            <Collapsible title="Embedding Function" dataTestId={`${flowId}-rag-use-custom-embedding`}>
                <div className="flex-column" style={{ marginTop: -20, marginBottom: -10 }}>
                    <InfoCheckbox
                        label="Use Custom Embedding Function "
                        info={"If True, will use the custom embedding function. Default is False."}
                        checked={retrieveConfig.useCustomEmbedding ?? false}
                        onChange={onUseCustomEmbeddingChange}
                        dataTestId={`${flowId}-rag-use-custom-embedding-checkbox`}
                    />
                    {retrieveConfig.useCustomEmbedding && (
                        <>
                            <label>Embedding Function:</label>
                            <div className="margin-top-10">
                                <Editor
                                    darkMode={isDarkMode}
                                    value={
                                        retrieveConfig.embeddingFunction ??
                                        DEFAULT_RAG_CUSTOM_EMBEDDING_FUNCTION
                                    }
                                    onChange={onEmbeddingFunctionChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </Collapsible>
            <Collapsible title="Token Count" dataTestId={`${flowId}-rag-use-custom-tokenCount`}>
                <div className="flex-column" style={{ marginTop: -20, marginBottom: -10 }}>
                    <InfoCheckbox
                        label="Use Custom Token Count Function "
                        info={"If True, will use a custom token count function. Default is False."}
                        checked={retrieveConfig.useCustomTokenCount ?? false}
                        onChange={onUseCustomTokenCountChange}
                        dataTestId={`${flowId}-rag-use-custom-tokenCount-checkbox`}
                    />
                    {retrieveConfig.useCustomTokenCount && (
                        <>
                            <label>Custom Token Count Function:</label>
                            <div className="margin-top-10">
                                <Editor
                                    darkMode={isDarkMode}
                                    value={
                                        retrieveConfig.customTokenCountFunction ??
                                        DEFAULT_RAG_CUSTOM_TOKEN_COUNT_FUNCTION
                                    }
                                    onChange={onCustomTokenCountFunctionChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </Collapsible>
            <Collapsible title="Text Split" dataTestId={`${flowId}-rag-use-custom-textSplit`}>
                <div className="flex-column" style={{ marginTop: -20, marginBottom: -10 }}>
                    <InfoCheckbox
                        label="Use Custom Text Split Function "
                        info={"If True, will use a custom text split function. Default is False."}
                        checked={retrieveConfig.useCustomTextSplit ?? false}
                        onChange={onUseCustomTextSplitChange}
                        dataTestId={`${flowId}-rag-use-custom-textSplit-checkbox`}
                    />
                    {retrieveConfig.useCustomTextSplit && (
                        <>
                            <label>Custom Text Split Function:</label>
                            <div className="margin-top-10">
                                <Editor
                                    darkMode={isDarkMode}
                                    value={
                                        retrieveConfig.customTextSplitFunction ??
                                        DEFAULT_RAG_CUSTOM_TEXT_SPLIT_FUNCTION
                                    }
                                    onChange={onCustomTextSplitFunctionChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </Collapsible>
        </div>
    );
};

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
# ) -> List[str]:
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
