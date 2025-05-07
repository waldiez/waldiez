/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { SidebarViewProps } from "@waldiez/containers/sidebar/types";
import { useWaldiez } from "@waldiez/store";

export const useSidebarView = (props: SidebarViewProps) => {
    const { selectedNodeType, onSelectNodeType } = props;
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isAgentsViewCollapsed, setIsAgentsViewCollapsed] = useState<boolean>(false);
    const flowId = useWaldiez(s => s.flowId);
    const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, agentType?: string) => {
        event.dataTransfer.setData("application/node", nodeType);
        if (nodeType === "agent") {
            event.dataTransfer.setData("application/agent", agentType ?? "user_proxy");
        }
        event.dataTransfer.effectAllowed = "move";
    };
    const onShowAgents = () => {
        if (selectedNodeType !== "agent") {
            onSelectNodeType("agent");
            setIsAgentsViewCollapsed(false);
        } else {
            setIsAgentsViewCollapsed(!isAgentsViewCollapsed);
        }
    };
    const onShowModels = () => {
        onSelectNodeType("model");
    };
    const onShowSkills = () => {
        onSelectNodeType("skill");
    };
    const onUserDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart(event, "agent");
    };
    const onAssistantDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart(event, "agent", "assistant");
    };
    const onReasoningDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart(event, "agent", "reasoning");
    };
    const onCaptainDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart(event, "agent", "captain");
    };
    const onManagerDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart(event, "agent", "group_manager");
    };
    const onOpenEditModal = () => {
        setIsEditModalOpen(true);
    };
    const onCloseEditModal = () => {
        setIsEditModalOpen(false);
    };
    return {
        flowId,
        isEditModalOpen,
        isAgentsViewCollapsed,
        onOpenEditModal,
        onCloseEditModal,
        onShowAgents,
        onShowModels,
        onShowSkills,
        onUserDragStart,
        onAssistantDragStart,
        onReasoningDragStart,
        onCaptainDragStart,
        onManagerDragStart,
    };
};
