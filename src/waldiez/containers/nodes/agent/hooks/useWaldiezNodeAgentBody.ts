/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useWaldiezNodeAgentBody = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    isModalOpen: boolean;
}) => {
    const { id, data, isModalOpen } = props;
    const getGroupMembers = useWaldiez(s => s.getGroupMembers);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const updateAgentData = useWaldiez(s => s.updateAgentData);
    const onNodeDoubleClick = useWaldiez(s => s.onNodeDoubleClick);
    const removeGroupMember = useWaldiez(s => s.removeGroupMember);
    const reselectNode = useWaldiez(s => s.reselectNode);
    const groupMembers = getGroupMembers(id) as WaldiezNodeAgent[];
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!isModalOpen) {
            const agent = getAgentById(id) as WaldiezNodeAgent;
            if (agent) {
                updateAgentData(id, { ...agent.data, description: event.target.value });
            }
        }
    };
    const onOpenMemberModal = (member: Node) => {
        if (!isModalOpen) {
            onNodeDoubleClick(null, member);
        }
    };
    const onRemoveGroupMember = (member: Node) => {
        if (!isModalOpen) {
            if (!data.parentId && data.agentType === "manager") {
                removeGroupMember(id, member.id);
                const storedAgent = getAgentById(id);
                if (!storedAgent) {
                    return;
                }
                if (storedAgent.data) {
                    updateAgentData(id, { ...(storedAgent.data as WaldiezNodeAgentData) });
                }
                setTimeout(() => {
                    reselectNode(member.id);
                }, 200);
            }
        }
    };
    return {
        groupMembers,
        onDescriptionChange,
        onRemoveGroupMember,
        onOpenMemberModal,
    };
};
