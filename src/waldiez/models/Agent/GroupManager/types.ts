/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";
import { WaldiezAgentGroupManagerSpeakers } from "@waldiez/models/Agent/GroupManager/GroupSpeakers";

export type GroupChatSpeakerSelectionMethodOption = "default" | "auto" | "manual" | "random" | "round_robin"; //| "custom";

export type GroupChatSpeakerSelectionMode = "repeat" | "transition";
export type GroupChatSpeakerTransitionsType = "allowed" | "disallowed";
export type WaldiezNodeAgentGroupManagerData = WaldiezAgentCommonData & {
    maxRound: number;
    adminName: string | null;
    speakers: WaldiezAgentGroupManagerSpeakers;
    enableClearHistory?: boolean;
    sendIntroductions?: boolean;
    groupName?: string;
    initialAgentId?: string;
    label: string;
};

export type WaldiezNodeAgentGroupManager = Node<WaldiezNodeAgentGroupManagerData, "agent">;
