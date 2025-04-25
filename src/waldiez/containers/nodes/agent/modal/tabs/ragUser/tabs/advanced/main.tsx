/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { InfoCheckbox, InfoLabel } from "@waldiez/components";
import { useWaldiezAgentRagUserAdvanced } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/advanced/hooks";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

export const WaldiezAgentRagUserAdvanced = (props: {
    id: string;
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
}) => {
    const { id, data } = props;
    const { retrieveConfig } = data;
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
        <>
            <div className="flex-column">
                <InfoLabel
                    label="Customized Prompt:"
                    info={"The customized prompt for the retrieve chat. Default is None."}
                />
                <textarea
                    title="Customized prompt"
                    rows={2}
                    defaultValue={retrieveConfig.customizedPrompt ?? ""}
                    onChange={onCustomizedPromptChange}
                    data-testid={`rag-customized-prompt-${id}`}
                />
            </div>
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
                />
            </div>
            <div className="flex-column">
                <InfoCheckbox
                    label="Update Context "
                    info={
                        "If False, will not apply `Update Context` for interactive retrieval. Default is True."
                    }
                    checked={retrieveConfig.updateContext}
                    onChange={onUpdateContextChange}
                    dataTestId={`rag-update-context-${id}`}
                />
            </div>
            <div className="flex-column">
                <InfoCheckbox
                    label="Get or Create "
                    info={"Whether to get the collection if it exists. Default is True."}
                    checked={retrieveConfig.getOrCreate}
                    onChange={onGetOrCreateChange}
                    dataTestId={`rag-get-or-create-${id}`}
                />
            </div>
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
                />
            </div>
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
                />
            </div>
            <div className="flex-column">
                <InfoCheckbox
                    label="Recursive "
                    info={"Whether to search documents recursively in the docs_path. Default is True."}
                    checked={retrieveConfig.recursive}
                    onChange={onRecursiveChange}
                    dataTestId={`rag-recursive-${id}`}
                />
            </div>
        </>
    );
};
