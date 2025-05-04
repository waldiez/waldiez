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
    const { id, isModalOpen } = props;
    const getAgentById = useWaldiez(s => s.getAgentById);
    const updateAgentData = useWaldiez(s => s.updateAgentData);
    const onNodeDoubleClick = useWaldiez(s => s.onNodeDoubleClick);
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!isModalOpen) {
            const agent = getAgentById(id) as WaldiezNodeAgent;
            if (agent) {
                updateAgentData(id, {
                    ...agent.data,
                    description: event.target.value,
                });
            }
        }
    };
    const onOpenMemberModal = (member: Node) => {
        if (!isModalOpen) {
            onNodeDoubleClick(null, member);
        }
    };
    return {
        onDescriptionChange,
        onOpenMemberModal,
    };
};
