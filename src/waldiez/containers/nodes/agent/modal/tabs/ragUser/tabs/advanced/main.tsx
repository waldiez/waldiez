/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";

import { InfoCheckbox, InfoLabel, TextareaInput } from "@waldiez/components";
import { useWaldiezAgentRagUserAdvanced } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/advanced/hooks";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

type WaldiezAgentRagUserAdvancedProps = {
    id: string;
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
};

/**
 * Component for configuring advanced RAG settings
 * Handles custom prompts, context updating, and collection management
 */
export const WaldiezAgentRagUserAdvanced = memo((props: WaldiezAgentRagUserAdvancedProps) => {
    const { id, data } = props;
    const { retrieveConfig } = data;

    // Use the hook for handlers
    const {
        onCustomizedPromptChange,
        onCustomizedAnswerPrefixChange,
        onUpdateContextChange,
        onGetOrCreateChange,
        onNewDocsChange,
        onOverwriteChange,
        onRecursiveChange,
    } = useWaldiezAgentRagUserAdvanced(props);

    return (
        <div className="rag-advanced-settings" data-testid={`rag-advanced-settings-${id}`}>
            {/* Customized Prompt */}
            <div className="flex-column">
                <InfoLabel
                    label="Customized Prompt:"
                    info="The customized prompt for the retrieve chat. Default is None."
                />

                <TextareaInput
                    title="Customized prompt"
                    rows={2}
                    value={retrieveConfig.customizedPrompt ?? ""}
                    onChange={onCustomizedPromptChange}
                    data-testid={`rag-customized-prompt-${id}`}
                    aria-label="Customized prompt for RAG"
                />
            </div>

            {/* Customized Answer Prefix */}
            <div className="flex-column">
                <InfoLabel
                    label="Customized Answer Prefix:"
                    info={
                        'The customized answer prefix for the retrieve chat. Default is "".' +
                        'If not "" and the customized_answer_prefix is not in the answer, ' +
                        "`Update Context` will be triggered."
                    }
                />

                <input
                    type="text"
                    title="Customized answer prefix"
                    value={retrieveConfig.customizedAnswerPrefix ?? ""}
                    onChange={onCustomizedAnswerPrefixChange}
                    data-testid={`rag-customized-answer-prefix-${id}`}
                    aria-label="Customized answer prefix"
                />
            </div>

            {/* Update Context Toggle */}
            <div className="flex-column">
                <InfoCheckbox
                    label="Update Context "
                    info="If False, will not apply `Update Context` for interactive retrieval. Default is True."
                    checked={retrieveConfig.updateContext}
                    onChange={onUpdateContextChange}
                    dataTestId={`rag-update-context-${id}`}
                    aria-label="Update context for interactive retrieval"
                />
            </div>

            {/* Get or Create Toggle */}
            <div className="flex-column">
                <InfoCheckbox
                    label="Get or Create "
                    info="Whether to get the collection if it exists. Default is True."
                    checked={retrieveConfig.getOrCreate}
                    onChange={onGetOrCreateChange}
                    dataTestId={`rag-get-or-create-${id}`}
                    aria-label="Get or create collection"
                />
            </div>

            {/* New Docs Toggle */}
            <div className="flex-column">
                <InfoCheckbox
                    label="New Docs "
                    info={
                        "When True, only adds new documents to the collection; " +
                        "when False, updates existing documents and adds new ones. " +
                        "The default value is True. Document id is used to determine if a document is new or existing. " +
                        "By default, the id is the hash value of the content."
                    }
                    checked={retrieveConfig.newDocs}
                    onChange={onNewDocsChange}
                    dataTestId={`rag-new-docs-${id}`}
                    aria-label="Only add new documents"
                />
            </div>

            {/* Overwrite Toggle */}
            <div className="flex-column">
                <InfoCheckbox
                    label="Overwrite "
                    info={
                        "Whether to overwrite the collection if it exists. Default is False. " +
                        "Case 1. if the collection does not exist, create the collection. " +
                        "Case 2. the collection exists, if overwrite is True, it will overwrite the collection. " +
                        "Case 3. the collection exists and overwrite is False, if get_or_create is True, " +
                        "it will get the collection, otherwise it raise a ValueError."
                    }
                    checked={retrieveConfig.overwrite}
                    onChange={onOverwriteChange}
                    dataTestId={`rag-overwrite-${id}`}
                    aria-label="Overwrite existing collection"
                />
            </div>

            {/* Recursive Toggle */}
            <div className="flex-column">
                <InfoCheckbox
                    label="Recursive "
                    info="Whether to search documents recursively in the docs_path. Default is True."
                    checked={retrieveConfig.recursive}
                    onChange={onRecursiveChange}
                    dataTestId={`rag-recursive-${id}`}
                    aria-label="Search documents recursively"
                />
            </div>
        </div>
    );
});

WaldiezAgentRagUserAdvanced.displayName = "WaldiezAgentRagUserAdvanced";
