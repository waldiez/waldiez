/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent } from "react";

import { CheckboxInput, StringList } from "@waldiez/components";
import { type EditFlowModalModalTabOtherProps } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/other/types";

export const EditFlowModalModalTabOther = (props: EditFlowModalModalTabOtherProps) => {
    const { flowId, data, onDataChange } = props;
    const { tags, requirements, cacheSeed } = data;
    const onAddTag = (tag: string) => {
        onDataChange({ tags: [...tags, tag] });
    };
    const onDeleteTag = (tag: string) => {
        onDataChange({ tags: tags.filter(t => t !== tag) });
    };
    const onTagChange = (oldValue: string, newValue: string) => {
        onDataChange({
            tags: tags.map(t => (t === oldValue ? newValue : t)),
        });
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
    const onCacheSeedToggleChange = (checked: boolean) => {
        onDataChange({ cacheSeed: checked ? null : 42 });
    };
    const onCacheSeedValueChange = (e: ChangeEvent<HTMLInputElement>) => {
        try {
            const cacheSeed = parseInt(e.target.value);
            onDataChange({ cacheSeed });
        } catch (_) {
            // ignore
        }
    };
    const viewLabelInfo = () => (
        <div>
            Requirements to <span className="bold italic">pip install</span> before running this flow
        </div>
    );
    return (
        <div
            className="padding-left-10 padding-right-10"
            data-testid={`edit-flow-${flowId}-modal-other-view`}
        >
            <CheckboxInput
                id={`edit-flow-${flowId}-modal-cache-seed-toggle`}
                label="Disable cache"
                isChecked={typeof cacheSeed !== "number"}
                onCheckedChange={onCacheSeedToggleChange}
                data-testid={`edit-flow-${flowId}-modal-cache-seed-toggle`}
            />
            {typeof cacheSeed === "number" && (
                <div className="margin-top-5 flex-align-center">
                    <div className="margin-left-5 margin-right-5"> Cache seed:</div>
                    <input
                        type="number"
                        step={1}
                        placeholder="42"
                        value={cacheSeed}
                        onChange={onCacheSeedValueChange}
                        id={`edit-flow-${flowId}-cache-seed-input`}
                        data-testid={`edit-flow-${flowId}-cache-seed-input`}
                    />
                </div>
            )}
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
