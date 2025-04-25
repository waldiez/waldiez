/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, NodeChange, applyNodeChanges } from "@xyflow/react";

import { setViewPortTopLeft } from "@waldiez/store/utils";
import { IWaldiezNodeStore, WaldiezNodeType, typeOfGet, typeOfSet } from "@waldiez/types";
import { getFlowRoot } from "@waldiez/utils";

export class WaldiezNodeStore implements IWaldiezNodeStore {
    private get: typeOfGet;
    private set: typeOfSet;
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezNodeStore(get, set);
    }
    showNodes = (nodeType: WaldiezNodeType) => {
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.type === nodeType) {
                    return { ...node, hidden: false };
                }
                return { ...node, hidden: true };
            }),
        });
        if (nodeType !== "agent") {
            setViewPortTopLeft(this.get().rfInstance);
        }
    };
    onNodesChange = (changes: NodeChange[]) => {
        const nodes = applyNodeChanges(changes, this.get().nodes);
        this.set({ nodes, updatedAt: new Date().toISOString() });
    };

    onNodeDoubleClick = (_event: any, node: Node) => {
        const openDialogs = document.querySelectorAll("dialog[open]");
        if (openDialogs.length > 0) {
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
}
