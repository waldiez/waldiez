/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { WaldiezFlow, WaldiezFlowData } from "@waldiez/models";

const createdAt = new Date().toISOString();
const updatedAt = new Date().toISOString();

// noinspection JSUnusedGlobalSymbols
export const waldiezFlow: WaldiezFlow = {
    id: "wf-1",
    storageId: "wf-1",
    type: "flow",
    version: __WALDIEZ_VERSION__,
    name: "Waldiez Flow",
    createdAt,
    updatedAt,
    data: new WaldiezFlowData(),
    tags: ["waldiez"],
    requirements: ["requirement1", "requirement2"],
    description: "Waldiez",
};
