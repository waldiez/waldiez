/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useMemo, useRef } from "react";

import { WaldiezContext } from "@waldiez/store/context";
import { createWaldiezStore } from "@waldiez/store/creator";
import type { WaldiezProviderProps, WaldiezStore } from "@waldiez/store/types";

/* eslint-disable tsdoc/syntax */
/**
 * WaldiezProvider
 * A React provider component that creates and provides a Waldiez store.
 * It initializes the store with the provided props and makes it available to its children.
 * @param props - The properties to initialize the Waldiez store.
 * @param props.children - The child components that will have access to the Waldiez store.
 * @param props.isReadOnly - Whether the store is read-only.
 * @param props.nodes - Initial nodes for the flow.
 * @param props.edges - Initial edges for the flow.
 * @param props.flowId - The unique identifier for the flow.
 * @param props.name - The name of the flow.
 * @param props.description - The description of the flow.
 * @param props.tags - Tags associated with the flow.
 * @param props.requirements - Requirements for the flow.
 * @param props.createdAt - The creation date of the flow.
 * @param props.updatedAt - The last updated date of the flow.
 * @param props.storageId - The storage identifier for the flow.
 * @param props.onUpload - Callback for upload events.
 * @param props.onChange - Callback for change events.
 * @param props.onSave - Callback for save events.
 * @param props.onRun - Callback for run events.
 * @param props.onStepRun - Callback for step run events.
 * @param props.onConvert - Callback for convert events.
 * @param props.rfInstance - The React Flow instance.
 * @param props.isAsync - Whether the flow is asynchronous.
 * @param props.cacheSeed - Seed for caching purposes.
 * @returns A provider component that wraps its children with the Waldiez store context.
 */
export function WaldiezProvider({ children, ...props }: WaldiezProviderProps) {
    const storeRef = useRef<WaldiezStore | undefined>(undefined);
    const isReadOnly = typeof props.isReadOnly === "boolean" ? props.isReadOnly : false;
    const nodes = props.nodes;
    const edges = props.edges;
    const flowId = props.flowId;
    const name = props.name;
    const description = props.description;
    const tags = props.tags;
    const requirements = props.requirements;
    const createdAt = props.createdAt;
    const updatedAt = props.updatedAt;
    const storageId = props.storageId;
    const onUpload = props.onUpload ?? null;
    const onChange = props.onChange ?? null;
    const onSave = props.onSave ?? null;
    const onRun = props.onRun ?? null;
    const onStepRun = props.onStepRun ?? null;
    const onConvert = props.onConvert ?? null;
    const checkpoints = props.checkpoints ?? null;
    const rfInstance = props.rfInstance;
    const isAsync = props.isAsync ?? false;
    const cacheSeed = props.cacheSeed ?? 42;
    const store = useMemo(() => {
        storeRef.current = createWaldiezStore({
            flowId,
            isAsync,
            isReadOnly,
            name,
            description,
            tags,
            requirements,
            storageId,
            createdAt,
            updatedAt,
            nodes,
            edges,
            rfInstance,
            cacheSeed,
            onUpload,
            onChange,
            onSave,
            onRun,
            onStepRun,
            onConvert,
            checkpoints,
        });
        return storeRef.current;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowId]);
    return <WaldiezContext.Provider value={store}>{children}</WaldiezContext.Provider>;
}
