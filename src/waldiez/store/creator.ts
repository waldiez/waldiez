/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import diff from "microdiff";
import { temporal } from "zundo";

import { createStore } from "zustand";

import { WaldiezAgentStore } from "@waldiez/store/agent";
import { WaldiezChatParticipantsStore } from "@waldiez/store/chatParticipants";
import { WaldiezEdgeStore } from "@waldiez/store/edge";
import { WaldiezFlowStore } from "@waldiez/store/flow";
import { WaldiezModelStore } from "@waldiez/store/model";
import { WaldiezNodeStore } from "@waldiez/store/node";
import { WaldiezToolStore } from "@waldiez/store/tool";
import type { WaldiezState, WaldiezStoreProps } from "@waldiez/store/types";
import { getId } from "@waldiez/utils";

/**
 * createWaldiezStore
 * Creates a new Waldiez zustand store.
 * @param props - The props to create the store with
 * @see {@link WaldiezStoreProps}
 * @see {@link WaldiezState}
 * @returns A new Waldiez store
 */
export const createWaldiezStore = (props: WaldiezStoreProps) => {
    const {
        flowId = `wf-${getId()}`,
        isAsync = false,
        isReadOnly = false,
        skipExport = false,
        skipImport = false,
        edges = [],
        nodes = [],
        name = "Untitled Flow",
        description = "A new Waldiez flow",
        tags = [],
        requirements = [],
        createdAt = new Date().toISOString(),
        updatedAt = new Date().toISOString(),
        viewport = { zoom: 1, x: 50, y: 50 },
        onUpload = null,
        onChange = null,
        onSave = null,
        onRun = null,
        onStepRun = null,
        onConvert = null,
    } = props;
    const storageId = props.storageId ?? flowId;
    return createStore<WaldiezState>()(
        temporal(
            (set, get) => ({
                rfInstance: props?.rfInstance,
                flowId,
                isAsync,
                isReadOnly,
                skipExport,
                skipImport,
                storageId,
                name: name,
                description: description,
                tags: tags,
                requirements: requirements,
                createdAt,
                updatedAt,
                viewport,
                nodes,
                edges,
                onUpload,
                onChange,
                onSave,
                onRun,
                onStepRun,
                onConvert,
                activeSenderId: null,
                activeRecipientId: null,
                activeEventType: null,
                ...WaldiezChatParticipantsStore.create(get, set),
                ...WaldiezAgentStore.create(get, set),
                ...WaldiezModelStore.create(get, set),
                ...WaldiezToolStore.create(get, set),
                ...WaldiezNodeStore.create(get, set),
                ...WaldiezEdgeStore.create(get, set),
                ...WaldiezFlowStore.create(get, set),
            }),
            {
                equality: zundoEquality,
                partialize: (state: WaldiezState) => {
                    const { flowId, nodes, edges, name, description, requirements, tags } = state;
                    return {
                        flowId,
                        nodes,
                        edges,
                        name,
                        description,
                        requirements,
                        tags,
                    };
                },
            },
        ),
    );
};

/**
 * zundoEquality
 * Custom equality function for zundo to compare past and current state.
 * It checks if the changes are significant enough to warrant a new history entry.
 * @param pastState - The previous state of the Waldiez store.
 * @param currentState - The current state of the Waldiez store.
 * @returns true if the states are considered equal, false otherwise.
 */
const zundoEquality = (pastState: Partial<WaldiezState>, currentState: Partial<WaldiezState>) => {
    const diffs = diff(pastState, currentState);
    // only check nodes[n].data and edges[n].data
    // if we only have 'updatedAt' changes, we can ignore them
    if (diffs.length === 0) {
        return true;
    }
    // console.log(diffs);
    return diffs.every(diff => {
        if (diff.type === "CREATE" && diff.path.length === 2) {
            // new node or edge
            return false;
        }
        if (
            diff.path.length === 1 &&
            typeof diff.path[0] === "string" &&
            ["name", "description", "tags", "requirements"].includes(diff.path[0])
        ) {
            return false;
        }
        if (diff.path.includes("nodes") && diff.path.includes("data")) {
            return false;
        }
        return !(
            diff.path.includes("edges") &&
            diff.path.includes("data") &&
            !diff.path.includes("position")
        );
    });
};
