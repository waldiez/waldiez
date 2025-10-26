/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* c8 ignore file -- @preserve */
import { type Node, type NodeChange, type Viewport, applyNodeChanges } from "@xyflow/react";

import { setViewPortTopLeft } from "@waldiez/store/utils";
import type { IWaldiezNodeStore, WaldiezNodeType, typeOfGet, typeOfSet } from "@waldiez/types";
import { getFlowRoot } from "@waldiez/utils";

/**
 * WaldiezNodeStore
 * A store for managing nodes in the Waldiez flow.
 * It provides methods to show/hide nodes, handle node changes, and manage viewport.
 * @see {@link IWaldiezNodeStore}
 */
export class WaldiezNodeStore implements IWaldiezNodeStore {
    private readonly get: typeOfGet;
    private readonly set: typeOfSet;

    /**
     * Creates an instance of WaldiezNodeStore.
     * @param get - A function to get the current state.
     * @param set - A function to set the new state.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    /**
     * Creates a new instance of WaldiezNodeStore.
     * @param get - A function to get the current state.
     * @param set - A function to set the new state.
     * @returns A new instance of WaldiezNodeStore.
     */
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezNodeStore(get, set);
    }
    /**
     * Shows nodes of a specific type and hides others.
     * If the node type is "agent", it restores the previous viewport.
     * Otherwise, it stores the current viewport before changing the visibility.
     * @param nodeType - The type of nodes to show.
     * @see {@link WaldiezNodeType}
     * @see {@link IWaldiezNodeStore.showNodes}
     */
    showNodes = (nodeType: WaldiezNodeType) => {
        if (nodeType !== "agent") {
            if (this.isShowingAgents()) {
                this.storePreviousViewport();
            }
            setViewPortTopLeft(this.get().rfInstance);
        } else {
            this.restorePreviousViewport();
        }
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.type === nodeType) {
                    return { ...node, hidden: false };
                }
                return { ...node, hidden: true };
            }),
        });
    };
    /**
     * Checks if there are any visible agent nodes in the current state.
     * @returns True if there are visible agent nodes, false otherwise.
     * @see {@link IWaldiezNodeStore.isShowingAgents}
     */
    isShowingAgents = () => {
        return this.get().nodes.some(node => node.type === "agent" && node.hidden === false);
    };
    /**
     * Stores the current viewport before changing visibility of nodes.
     * @see {@link IWaldiezNodeStore.storePreviousViewport}
     */
    storePreviousViewport = () => {
        const rfInstance = this.get().rfInstance;
        let previousViewport: Viewport | undefined;
        if (rfInstance) {
            previousViewport = {
                x: rfInstance.getViewport().x,
                y: rfInstance.getViewport().y,
                zoom: rfInstance.getViewport().zoom,
            };
        } else {
            previousViewport = this.get().viewport;
        }
        this.set({
            previousViewport,
            updatedAt: new Date().toISOString(),
        });
    };
    /**
     * Restores the previous viewport stored in the state.
     * If a previous viewport exists, it sets the current viewport to that value
     * and updates the rfInstance if available.
     * @see {@link IWaldiezNodeStore.restorePreviousViewport}
     */
    restorePreviousViewport = () => {
        const previousViewport = this.get().previousViewport;
        if (previousViewport) {
            this.set({
                viewport: previousViewport,
                updatedAt: new Date().toISOString(),
            });
            const rfInstance = this.get().rfInstance;
            if (rfInstance) {
                // noinspection JSIgnoredPromiseFromCall
                rfInstance.setViewport(previousViewport);
            }
        }
    };
    /**
     * Handles changes to nodes.
     * It applies the changes to the current nodes and updates the state.
     * @param changes - An array of NodeChange objects representing the changes to apply.
     * @see {@link IWaldiezNodeStore.onNodesChange}
     */
    onNodesChange = (changes: NodeChange[]) => {
        const nodes = applyNodeChanges(changes, this.get().nodes);
        this.set({ nodes, updatedAt: new Date().toISOString() });
    };

    /**
     * Handles double-click events on nodes.
     * If a dialog is open, it does nothing.
     * Otherwise, it finds the flow root and triggers a click on the button associated with the node.
     * @param _event - The event object.
     * @param node - The node that was double-clicked.
     * @see {@link IWaldiezNodeStore.onNodeDoubleClick}
     */
    onNodeDoubleClick = (_event: any, node: Node) => {
        const openModals = Array.from(document.querySelectorAll(".modal-root .modal")).filter(
            el => (el.querySelector(".modal-content") as HTMLElement).offsetParent !== null, // Only visible modals
        );
        if (openModals.length > 0) {
            return;
        }
        const flowId = this.get().flowId;
        const flowRoot = getFlowRoot(flowId);
        if (flowRoot) {
            const openModalBtn = flowRoot.querySelector(`[data-node-id="${node.id}"]`) as HTMLButtonElement;
            if (openModalBtn) {
                openModalBtn.click();
            }
        }
    };
    /**
     * Selects a node by its ID.
     * If the node is already selected, it deselects it.
     * Otherwise, it selects the node and deselects all others.
     * @param id - The ID of the node to select.
     * @see {@link IWaldiezNodeStore.reselectNode}
     */
    reselectNode = (id: string) => {
        const node = this.get().nodes.find(n => n.id === id);
        if (!node) {
            return;
        }
        if (node.selected) {
            this.set({
                nodes: this.get().nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, selected: false };
                    }
                    return node;
                }),
            });
        }
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.id === id) {
                    return { ...node, selected: true };
                }
                return { ...node, selected: false };
            }),
        });
    };
    /**
     * Highlights a node by its ID.
     * It sets the className of the node to "highlight" if it matches the ID.
     * Otherwise, it clears the highlight by setting className to an empty string.
     * @param nodeId - The ID of the node to highlight.
     * @see {@link IWaldiezNodeStore.highlightNode}
     */
    highlightNode = (nodeId: string) => {
        this.set({
            nodes: this.get().nodes.map(node => ({
                ...node,
                className: node.id === nodeId ? "highlight" : "",
            })),
        });
    };
    /**
     * Clears the highlight from all nodes by setting their className to an empty string.
     * @see {@link IWaldiezNodeStore.clearNodeHighlight}
     */
    clearNodeHighlight = () => {
        this.set({
            nodes: this.get().nodes.map(node => ({
                ...node,
                className: "",
            })),
        });
    };
}
