/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { KeyboardEvent } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { useWaldiez, useWaldiezHistory } from "@waldiez/store";
import { getFlowRoot } from "@waldiez/utils";

export const useKeys = (flowId: string, onSave?: ((flow: string) => void) | null) => {
    const { undo, redo, futureStates, pastStates } = useWaldiezHistory(s => s);
    const readOnly = useWaldiez(s => s.isReadOnly);
    const isReadOnly = readOnly === true;
    const deleteAgent = useWaldiez(s => s.deleteAgent);
    const deleteEdge = useWaldiez(s => s.deleteEdge);
    const deleteModel = useWaldiez(s => s.deleteModel);
    const deleteTool = useWaldiez(s => s.deleteTool);
    const saveFlow = useWaldiez(s => s.saveFlow);
    const listenForSave = typeof onSave === "function" && isReadOnly === false;
    const isFlowVisible = () => {
        // if on jupyter, we might have more than one tabs with a flow
        // let's check if the current flow is visible (i.e. we are in the right tab)
        const rootDiv = getFlowRoot(flowId);
        if (!rootDiv) {
            return false;
        }
        const clientRect = rootDiv.getBoundingClientRect();
        return clientRect.width > 0 && clientRect.height > 0;
    };
    {
        useHotkeys(
            "mod+z",
            () => {
                if (pastStates.length > 0) {
                    if (isFlowVisible()) {
                        undo();
                    }
                }
            },
            { scopes: flowId },
        );
        useHotkeys(
            ["shift+mod+z", "mod+y"],
            () => {
                if (futureStates.length > 0) {
                    if (isFlowVisible()) {
                        redo();
                    }
                }
            },
            { scopes: flowId },
        );
    }
    if (listenForSave) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useHotkeys(
            "mod+s",
            event => {
                if (isFlowVisible()) {
                    event.preventDefault();
                    saveFlow();
                }
            },
            { scopes: flowId },
        );
    }
    const onDeleteKey = (event: KeyboardEvent) => {
        if (isReadOnly) {
            return;
        }
        const target = event.target;
        const isNode = target instanceof Element && target.classList.contains("react-flow__node");
        if (isNode) {
            deleteNode(target);
        } else {
            const isEdge =
                target instanceof Element &&
                (target.classList.contains("react-flow__edge") ||
                    target.classList.contains("edge-data-view"));
            if (isEdge) {
                onDeleteEdge(target);
            }
        }
    };
    const onKeyDown = (event: KeyboardEvent | undefined) => {
        // also on Backspace
        if (isReadOnly) {
            return;
        }
        if (event?.key === "Delete" || event?.key === "Backspace") {
            if (isFlowVisible()) {
                onDeleteKey(event);
            }
        }
    };
    const deleteNode = (target: Element) => {
        const nodeId = target.getAttribute("data-id");
        if (nodeId) {
            const isAgent = target.classList.contains("react-flow__node-agent");
            const isModel = target.classList.contains("react-flow__node-model");
            const isTool = target.classList.contains("react-flow__node-tool");
            if (isAgent) {
                deleteAgent(nodeId);
            } else {
                if (isModel) {
                    deleteModel(nodeId);
                } else {
                    if (isTool) {
                        deleteTool(nodeId);
                    }
                }
            }
        }
    };
    const onDeleteEdge = (target: Element) => {
        const edgeId = target.getAttribute("data-id");
        if (edgeId) {
            deleteEdge(edgeId);
        }
    };
    return { onKeyDown };
};
