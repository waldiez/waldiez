/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useState } from "react";
import isEqual from "react-fast-compare";

import type { SingleValue } from "@waldiez/components";
import type {
    EditFlowModalData,
    EditFlowModalProps,
} from "@waldiez/containers/sidebar/modals/editFlowModal/types";
import type { WaldiezEdge } from "@waldiez/models/types";
import { useWaldiez } from "@waldiez/store";

export const useEditFlowModal = (props: EditFlowModalProps) => {
    const { isOpen, onClose } = props;
    const getFlowInfo = useWaldiez(s => s.getFlowInfo);
    const updateFlowInfo = useWaldiez(s => s.updateFlowInfo);
    const updateFlowOrder = useWaldiez(s => s.updateFlowOrder);
    const updateFlowPrerequisites = useWaldiez(s => s.updateFlowPrerequisites);
    const flowInfo = getFlowInfo();
    const { name, description, requirements, tags, isAsync, cacheSeed, skipDeps } = flowInfo;
    const [flowData, setFlowData] = useState<EditFlowModalData>({
        name,
        description,
        requirements,
        tags,
        isAsync,
        cacheSeed,
        skipDeps,
    });
    const [selectedNewEdge, setSelectedNewEdge] = useState<WaldiezEdge | null>(null);
    const getFlowEdges = useWaldiez(s => s.getFlowEdges);
    const { used: sortedEdges, remaining: remainingEdges } = getFlowEdges();
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    // tmp state (to save onSubmit, discard onCancel)
    const [sortedEdgesState, setSortedEdgesState] = useState<WaldiezEdge[]>(sortedEdges);
    const [remainingEdgesState, setRemainingEdgeState] = useState<WaldiezEdge[]>(remainingEdges);
    const isDataDirty = !isEqual(flowData, {
        name,
        description,
        requirements,
        tags,
        isAsync,
        cacheSeed,
        skipDeps,
    });
    const isEdgesDirty = !isEqual(sortedEdgesState, sortedEdges);
    const [isDirty, setIsDirty] = useState<boolean>(isDataDirty || isEdgesDirty);
    const onSubmit = () => {
        updateFlowInfo(flowData);
        if (!flowData.isAsync) {
            const edgeOrders = sortedEdgesState
                .map((edge, index) => ({
                    id: edge.id,
                    order: index,
                }))
                .concat(
                    remainingEdgesState.map(edge => ({
                        id: edge.id,
                        order: -1,
                    })),
                );
            updateFlowOrder(edgeOrders);
        } else {
            updateFlowPrerequisites(sortedEdgesState);
        }
        onFlowChanged();
        setIsDirty(false);
    };
    const reset = useCallback(() => {
        const { name, description, requirements, tags, isAsync, cacheSeed, skipDeps } = getFlowInfo();
        setFlowData({
            name,
            description,
            requirements,
            tags,
            isAsync,
            cacheSeed,
            skipDeps,
        });
        const { used, remaining } = getFlowEdges();
        setSortedEdgesState(used);
        setRemainingEdgeState(remaining);
        setIsDirty(false);
    }, [getFlowEdges, getFlowInfo]);
    useEffect(() => {
        reset();
    }, [isOpen, reset]);
    const onCancel = () => {
        reset();
        onClose();
    };
    const onDataChange = (partialData: Partial<EditFlowModalData>) => {
        const isDataDirty = !isEqual(
            { ...flowData, ...partialData },
            { name, description, requirements, tags, isAsync, cacheSeed, skipDeps },
        );
        const isEdgesDirty = !isEqual(sortedEdgesState, sortedEdges);
        setFlowData({ ...flowData, ...partialData });
        setIsDirty(isDataDirty || isEdgesDirty);
    };
    const onSelectedNewEdgeChange = (option: SingleValue<{ label: string; value: WaldiezEdge }>) => {
        if (option) {
            setSelectedNewEdge(option.value);
        }
    };
    const getNewEdgeOrder = () => {
        // find the last order
        let lastOrder = sortedEdgesState[sortedEdgesState.length - 1]?.data?.order;
        if (lastOrder === undefined) {
            lastOrder = sortedEdgesState.length;
        } else {
            lastOrder++;
        }
        if (lastOrder < 0) {
            lastOrder = 0;
        }
        return lastOrder;
    };
    const onAddEdge = () => {
        if (!selectedNewEdge) {
            return;
        }
        // it should be in the 'remaining' list
        if (remainingEdgesState.find(e => e.id === selectedNewEdge.id)) {
            const lastOrder = getNewEdgeOrder();
            const newSelectedEdge = {
                ...selectedNewEdge,
                data: { ...selectedNewEdge.data, order: lastOrder } as any,
            };
            setSortedEdgesState([...sortedEdgesState, newSelectedEdge]);
            setRemainingEdgeState(remainingEdgesState.filter(e => e.id !== selectedNewEdge.id));
            setSelectedNewEdge(null);
            setIsDirty(true);
        }
    };
    const onRemoveEdge = (edge: WaldiezEdge) => {
        // avoid having zero edges/chats in the flow
        if (sortedEdgesState.length === 1) {
            return;
        }
        // it should be in the 'sorted' list
        if (sortedEdgesState.find(e => e.id === edge.id)) {
            // set the order to -1
            // edge.data = { ...edge.data, order: -1 } as any;
            setSortedEdgesState(sortedEdgesState.filter(e => e.id !== edge.id));
            setRemainingEdgeState([
                ...remainingEdgesState,
                {
                    ...edge,
                    data: { ...edge.data, order: -1, prerequisites: [] } as any,
                },
            ]);
            setIsDirty(true);
        }
    };
    const onMoveEdgeUp = (index: number) => {
        // it should be in the 'sorted' list and not the first element
        if (
            index > 0 &&
            sortedEdgesState[index] !== undefined &&
            sortedEdgesState[index - 1] !== undefined &&
            sortedEdgesState.find(e => e.id === sortedEdgesState[index]?.id)
        ) {
            // swap the order between the current and the previous edge
            const previousEdge = sortedEdgesState[index - 1];
            const currentEdge = sortedEdgesState[index];
            const newSortedEdges = sortedEdgesState.slice();
            newSortedEdges[index - 1] = currentEdge!;
            newSortedEdges[index] = previousEdge!;
            setSortedEdgesState(setSyncPrerequisites(newSortedEdges));
            // setSortedEdgesState(newSortedEdges);
            setIsDirty(true);
        }
    };
    const setSyncPrerequisites = (newSortedEdges: WaldiezEdge[]) => {
        // if order > 0: set the prerequisites to the previous [edge.id]
        // if order === 0: set the prerequisites to []
        return newSortedEdges.map((edge, index) => {
            if (index === 0) {
                return {
                    ...edge,
                    data: { ...edge.data, order: 0, prerequisites: [] },
                } as WaldiezEdge;
            }
            const previousEdge = newSortedEdges[index - 1];
            return {
                ...edge,
                data: {
                    ...edge.data,
                    order: index,
                    prerequisites: [previousEdge?.id],
                },
            } as WaldiezEdge;
        });
    };
    const onPrerequisitesChange = (edge: WaldiezEdge, prerequisites: string[]) => {
        const newSortedEdges = sortedEdgesState.map(e => {
            if (e.id === edge.id) {
                return {
                    ...e,
                    data: { ...e.data, prerequisites },
                } as WaldiezEdge;
            }
            return e;
        });
        setSortedEdgesState(newSortedEdges);
        setIsDirty(true);
    };
    const onMoveEdgeDown = (index: number) => {
        // it should be in the 'sorted' list
        if (sortedEdgesState.find(e => e.id === sortedEdgesState[index]?.id)) {
            // swap the order between the current and the next edge
            const nextEdge = sortedEdgesState[index + 1];
            const nextOrder = nextEdge?.data?.order;
            const currentEdge = sortedEdgesState[index];
            const currentOrder = currentEdge?.data?.order;
            const newSortedEdges = sortedEdgesState.slice();
            newSortedEdges[index + 1] = {
                ...currentEdge,
                data: { ...currentEdge?.data, order: nextOrder },
            } as WaldiezEdge;
            newSortedEdges[index] = {
                ...nextEdge,
                data: { ...nextEdge?.data, order: currentOrder },
            } as WaldiezEdge;
            setSortedEdgesState(setSyncPrerequisites(newSortedEdges));
            setIsDirty(true);
        }
    };
    return {
        flowData,
        isOpen,
        sortedEdgesState,
        remainingEdgesState,
        selectedNewEdge,
        isDirty,
        onClose,
        onSubmit,
        onCancel,
        onDataChange,
        onSelectedNewEdgeChange,
        onAddEdge,
        onRemoveEdge,
        onMoveEdgeUp,
        onMoveEdgeDown,
        onPrerequisitesChange,
    };
};
