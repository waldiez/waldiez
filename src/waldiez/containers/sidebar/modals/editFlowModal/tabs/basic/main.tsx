/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { HandleASyncChatOrderAndPrerequisites } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/asyncChat";
import { HandleSyncChatOrder } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/syncChat";
import { EditFlowModalModalTabBasicProps } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/types";

export const EditFlowModalModalTabBasic = (props: EditFlowModalModalTabBasicProps) => {
    const { flowId, data, sortedEdges, remainingEdges, onDataChange } = props;
    const { name, description, isAsync, cacheSeed } = data;
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const name = event.target.value;
        onDataChange({ name });
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const description = event.target.value;
        onDataChange({ description });
    };
    const onAsyncChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ isAsync: e.target.checked });
    };
    const onCacheSeedToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ cacheSeed: e.target.checked ? null : 41 });
    };
    const onCacheSeedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const cacheSeed = parseInt(e.target.value);
            onDataChange({ cacheSeed });
        } catch (_) {
            // ignore
        }
    };
    const edgesCount = sortedEdges.length + remainingEdges.length;
    return (
        <div className="modal-body agent-panel agent-config-panel" id={`rf-${flowId}-edit-flow-modal`}>
            <label htmlFor={`rf-${flowId}-edit-flow-modal-name`}>Name</label>
            <input
                type="text"
                id={`rf-${flowId}-edit-flow-modal-name`}
                placeholder="Flow name"
                value={name}
                onChange={onNameChange}
                data-testid={`edit-flow-${flowId}-name-input`}
            />
            <label htmlFor={`rf-${flowId}-edit-flow-modal-description`}>Description</label>
            <textarea
                id={`rf-${flowId}-edit-flow-modal-description`}
                placeholder="Flow description"
                rows={2}
                value={description}
                onChange={onDescriptionChange}
                data-testid={`edit-flow-${flowId}-description-input`}
            />
            <label className="checkbox-label margin-left-5">
                <div className="checkbox-label-view">Disable cache</div>
                <input
                    type="checkbox"
                    checked={typeof cacheSeed !== "number"}
                    onChange={onCacheSeedToggleChange}
                    data-testid={`edit-flow-${flowId}-modal-cache-seed-toggle`}
                />
                <div className="checkbox"></div>
            </label>
            {typeof cacheSeed === "number" && (
                <div className="cache-seed-view flex">
                    <div className="margin-left-5 margin-right-5"> Cache seed:</div>
                    <input
                        type="number"
                        step={1}
                        placeholder="41"
                        value={cacheSeed}
                        onChange={onCacheSeedValueChange}
                        data-testid={`edit-flow-${flowId}-cache-seed-input`}
                    />
                </div>
            )}
            <label className="checkbox-label margin-left-5">
                <div className="checkbox-label-view">Async Mode</div>
                <input
                    type="checkbox"
                    checked={isAsync}
                    onChange={onAsyncChange}
                    data-testid={`edit-flow-${flowId}-modal-async-mode`}
                />
                <div className="checkbox"></div>
            </label>
            <label>Chat order {isAsync && "& prerequisites"} </label>
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
