/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";
import { WaldiezAgentGroupManagerSpeakers } from "@waldiez/models/Agent/GroupManager/GroupSpeakers";

export type GroupChatSpeakerSelectionMethodOption = "auto" | "manual" | "random" | "round_robin" | "custom";

export type GroupChatSpeakerSelectionMode = "repeat" | "transition";
export type GroupChatSpeakerTransitionsType = "allowed" | "disallowed";
export type WaldiezNodeAgentGroupManagerData = WaldiezAgentCommonData & {
    maxRound: number | null;
    adminName: string | null;
    speakers: WaldiezAgentGroupManagerSpeakers;
    enableClearHistory?: boolean;
    sendIntroductions?: boolean;
    label: string;
};

export type WaldiezNodeAgentGroupManager = Node<WaldiezNodeAgentGroupManagerData, "agent">;
