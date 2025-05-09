/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Editor, Select, SingleValue } from "@waldiez/components";
import { useToolNodeModal } from "@waldiez/containers/nodes/tool/modal/hooks";
import { WaldiezNodeToolModalProps } from "@waldiez/containers/nodes/tool/modal/types";
import { WaldiezToolType } from "@waldiez/models";

export const WaldiezToolBasicTab = (props: WaldiezNodeToolModalProps) => {
    const { toolId, data, darkMode } = props;
    const { onToolContentChange, onToolLabelChange, onToolDescriptionChange, onToolTypeChange } =
        useToolNodeModal(props);
    const toolTypeOptions: { value: WaldiezToolType; label: string }[] = [
        { value: "shared", label: "Shared" },
        { value: "custom", label: "Custom" },
        { value: "langchain", label: "Langchain" },
        { value: "crewai", label: "CrewAI" },
    ];
    const onToolTypeSelectChange = (option: SingleValue<{ value: WaldiezToolType; label: string }>) => {
        if (option) {
            onToolTypeChange(option.value);
        }
    };
    return (
        <div className="flex-column margin-top-10">
            <div className="info">
                Enter the tool details below. You can follow the instructions for each tool type in the
                comments of the content editor.
            </div>
            <label htmlFor={`tool-type-select-${toolId}`}>Type:</label>
            <Select
                options={toolTypeOptions}
                value={toolTypeOptions.find(option => option.value === data.toolType)}
                onChange={onToolTypeSelectChange}
                data-testid={`tool-type-select-${toolId}`}
            />
            <label htmlFor={`tool-label-input-${toolId}`}>Name:</label>
            <input
                title="Name"
                type="text"
                value={data.label}
                data-testid={`tool-label-input-${toolId}`}
                id={`tool-label-input-${toolId}`}
                onChange={onToolLabelChange}
            />
            <label>Description:</label>
            <textarea
                title="Description"
                rows={2}
                value={data.description}
                data-testid={`tool-description-input-${toolId}`}
                onChange={onToolDescriptionChange}
            />
            <label>Content:</label>
            <Editor value={data.content} onChange={onToolContentChange} darkMode={darkMode} />
        </div>
    );
};
