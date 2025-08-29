/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { Dict, StringList } from "@waldiez/components";
import { useToolNodeModal } from "@waldiez/containers/nodes/tool/modal/hooks";
import { type WaldiezNodeToolModalProps } from "@waldiez/containers/nodes/tool/modal/types";

export const WaldiezToolAdvancedTab = memo((props: WaldiezNodeToolModalProps) => {
    const { data } = props;
    const {
        onUpdateSecrets,
        onDeleteSecret,
        onAddSecret,
        onAddRequirement,
        onDeleteRequirement,
        onRequirementChange,
        onAddTag,
        onDeleteTag,
        onTagChange,
    } = useToolNodeModal(props);
    const requirementsViewLabelInfo = useMemo(
        () => (
            <div>
                Requirements to <span className="bold italic">pip install</span> for this tool
            </div>
        ),
        [],
    );
    return (
        <>
            <Dict
                viewLabel="Environment Variables:"
                items={data.secrets}
                itemsType="tool-secret"
                onUpdate={onUpdateSecrets}
                onDelete={onDeleteSecret}
                onAdd={onAddSecret}
                areValuesSecret={true}
            />
            <StringList
                viewLabel="Requirements:"
                viewLabelInfo={requirementsViewLabelInfo}
                placeholder="Add a requirement..."
                items={data.requirements}
                itemsType={"tool-requirements"}
                onItemAdded={onAddRequirement}
                onItemDeleted={onDeleteRequirement}
                onItemChange={onRequirementChange}
            />
            <StringList
                viewLabel="Tags:"
                placeholder="Add a tag..."
                items={data.tags}
                itemsType={"tool-tags"}
                onItemAdded={onAddTag}
                onItemDeleted={onDeleteTag}
                onItemChange={onTagChange}
            />
        </>
    );
});
