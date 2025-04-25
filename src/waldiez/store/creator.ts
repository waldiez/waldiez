/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import diff from "microdiff";
import { temporal } from "zundo";

import { createStore } from "zustand";

import { WaldiezAgentStore } from "@waldiez/store/agent";
import { WaldiezEdgeStore } from "@waldiez/store/edge";
import { WaldiezFlowStore } from "@waldiez/store/flow";
import { WaldiezModelStore } from "@waldiez/store/model";
import { WaldiezNodeStore } from "@waldiez/store/node";
import { WaldiezSkillStore } from "@waldiez/store/skill";
import { WaldiezState, WaldiezStoreProps } from "@waldiez/store/types";
import { getId } from "@waldiez/utils";

// eslint-disable-next-line complexity
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
                onConvert,
                ...WaldiezAgentStore.create(get, set),
                ...WaldiezModelStore.create(get, set),
                ...WaldiezSkillStore.create(get, set),
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

const zundoEquality = (pastState: Partial<WaldiezState>, currentState: Partial<WaldiezState>) => {
    const diffs = diff(pastState, currentState);
    // only check nodes[n].data and edges[n].data
    // if we only have 'updatedAt' changes, we can ignore them
    if (diffs.length === 0) {
        return true;
    }
    // console.log(diffs);
    const equal = diffs.every(diff => {
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
        if (diff.path.includes("edges") && diff.path.includes("data") && !diff.path.includes("position")) {
            return false;
        }
        return true;
    });
    // if (!equal) {
    //   console.log(diffs);
    // }
    return equal;
};
