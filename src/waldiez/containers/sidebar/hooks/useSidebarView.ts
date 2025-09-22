/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type DragEvent, useCallback, useMemo, useState } from "react";

import { type SidebarViewProps } from "@waldiez/containers/sidebar/types";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for managing sidebar view state and interactions
 */
export const useSidebarView = (props: SidebarViewProps) => {
    const { selectedNodeType, onSelectNodeType } = props;

    // State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isAgentsViewCollapsed, setIsAgentsViewCollapsed] = useState<boolean>(false);

    // Get flow ID from store
    const flowId = useWaldiez(s => s.flowId);

    // Base drag start handler
    const onDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>, nodeType: string, agentType?: string) => {
            event.dataTransfer.setData("application/node", nodeType);

            if (nodeType === "agent" && agentType) {
                event.dataTransfer.setData("application/agent", agentType);
            }

            event.dataTransfer.effectAllowed = "move";
        },
        [],
    );

    // Node type selection handlers
    const onShowAgents = useCallback(() => {
        if (selectedNodeType !== "agent") {
            onSelectNodeType("agent");
            setIsAgentsViewCollapsed(false);
        } else {
            setIsAgentsViewCollapsed(prev => !prev);
        }
    }, [selectedNodeType, onSelectNodeType]);

    const onShowModels = useCallback(() => {
        onSelectNodeType("model");
    }, [onSelectNodeType]);

    const onShowTools = useCallback(() => {
        onSelectNodeType("tool");
    }, [onSelectNodeType]);

    // Agent type specific drag handlers
    const onUserDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "user_proxy");
        },
        [onDragStart],
    );

    const onAssistantDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "assistant");
        },
        [onDragStart],
    );

    const onRagDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "rag_user_proxy");
        },
        [onDragStart],
    );

    const onDocDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "doc_agent");
        },
        [onDragStart],
    );

    const onReasoningDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "reasoning");
        },
        [onDragStart],
    );

    const onCaptainDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "captain");
        },
        [onDragStart],
    );

    const onManagerDragStart = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            onDragStart(event, "agent", "group_manager");
        },
        [onDragStart],
    );

    // Modal handlers
    const onOpenEditModal = useCallback(() => {
        setIsEditModalOpen(true);
    }, []);

    const onCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
    }, []);

    // Create a map of agent types to their drag handlers
    const agentDragHandlers = useMemo(
        () => ({
            user_proxy: onUserDragStart,
            assistant: onAssistantDragStart,
            reasoning: onReasoningDragStart,
            captain: onCaptainDragStart,
            group_manager: onManagerDragStart,
            rag_user_proxy: onRagDragStart,
        }),
        [
            onUserDragStart,
            onAssistantDragStart,
            onReasoningDragStart,
            onCaptainDragStart,
            onManagerDragStart,
            onRagDragStart,
        ],
    );

    return {
        flowId,
        isEditModalOpen,
        isAgentsViewCollapsed,
        onOpenEditModal,
        onCloseEditModal,
        onShowAgents,
        onShowModels,
        onShowTools,
        onUserDragStart,
        onDocDragStart,
        onAssistantDragStart,
        onReasoningDragStart,
        onCaptainDragStart,
        onManagerDragStart,
        agentDragHandlers,
    };
};
