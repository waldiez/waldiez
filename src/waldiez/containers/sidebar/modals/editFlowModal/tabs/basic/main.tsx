/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

import { CheckboxInput, TextareaInput } from "@waldiez/components";
import { HandleASyncChatOrderAndPrerequisites } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/asyncChat";
import { HandleSyncChatOrder } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/syncChat";
import { EditFlowModalModalTabBasicProps } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/types";

export const EditFlowModalModalTabBasic = (props: EditFlowModalModalTabBasicProps) => {
    const { flowId, data, sortedEdges, remainingEdges, onDataChange } = props;
    const { name, description, isAsync } = data;
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const name = event.target.value;
        onDataChange({ name });
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const description = event.target.value;
        onDataChange({ description });
    };
    const onAsyncChange = (checked: boolean) => {
        onDataChange({ isAsync: checked });
    };
    const edgesCount = sortedEdges.length + remainingEdges.length;
    return (
        <div className="flex-column padding-left-10 padding-right-10" id={`rf-${flowId}-edit-flow-modal`}>
            <label htmlFor={`rf-${flowId}-edit-flow-modal-name`}>Name</label>
            <input
                type="text"
                className="margin-right--20 margin-top-5 margin-bottom-10"
                id={`rf-${flowId}-edit-flow-modal-name`}
                placeholder="Flow name"
                value={name}
                onChange={onNameChange}
                data-testid={`edit-flow-${flowId}-name-input`}
            />
            <label htmlFor={`rf-${flowId}-edit-flow-modal-description`}>Description</label>
            <div className="margin-bottom-5" />
            <TextareaInput
                id={`rf-${flowId}-edit-flow-modal-description`}
                placeholder="Flow description"
                rows={2}
                value={description}
                onChange={onDescriptionChange}
                data-testid={`edit-flow-${flowId}-description-input`}
            />
            <div className="margin-bottom-5" />
            <CheckboxInput
                id={`edit-flow-${flowId}-modal-async-mode`}
                label="Async Mode"
                isChecked={isAsync}
                onCheckedChange={onAsyncChange}
            />
            <div className="margin-top-5 margin-left-5">Chat order {isAsync && "& prerequisites"} </div>
            {edgesCount === 0 ? (
                <div className="info">No chats added to the flow yet.</div>
            ) : isAsync ? (
                <HandleASyncChatOrderAndPrerequisites {...props} />
            ) : (
                <HandleSyncChatOrder {...props} />
            )}
        </div>
    );
};
