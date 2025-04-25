/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { StringList } from "@waldiez/components";
import { EditFlowModalModalTabOtherProps } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/other/types";

export const EditFlowModalModalTabOther = (props: EditFlowModalModalTabOtherProps) => {
    const { flowId, data, onDataChange } = props;
    const { tags, requirements } = data;
    const onAddTag = (tag: string) => {
        onDataChange({ tags: [...tags, tag] });
    };
    const onDeleteTag = (tag: string) => {
        onDataChange({ tags: tags.filter(t => t !== tag) });
    };
    const onTagChange = (oldValue: string, newValue: string) => {
        onDataChange({ tags: tags.map(t => (t === oldValue ? newValue : t)) });
    };
    const onAddRequirement = (requirement: string) => {
        onDataChange({ requirements: [...requirements, requirement] });
    };
    const onDeleteRequirement = (requirement: string) => {
        onDataChange({
            requirements: requirements.filter(r => r !== requirement),
        });
    };
    const onRequirementChange = (oldValue: string, newValue: string) => {
        onDataChange({
            requirements: requirements.map(r => (r === oldValue ? newValue : r)),
        });
    };
    const viewLabelInfo = () => (
        <div>
            Requirements to <span className="bold italic">pip install</span> before running this flow
        </div>
    );
    return (
        <div
            className="modal-body agent-panel agent-config-panel"
            data-testid={`edit-flow-${flowId}-modal-other-view`}
        >
            <StringList
                items={requirements}
                itemsType="requirement"
                viewLabel="Additional Requirements"
                viewLabelInfo={viewLabelInfo}
                onItemAdded={onAddRequirement}
                onItemDeleted={onDeleteRequirement}
                onItemChange={onRequirementChange}
            />
            <StringList
                items={tags}
                itemsType="tag"
                viewLabel="Tags"
                onItemAdded={onAddTag}
                onItemDeleted={onDeleteTag}
                onItemChange={onTagChange}
            />
        </div>
    );
};
