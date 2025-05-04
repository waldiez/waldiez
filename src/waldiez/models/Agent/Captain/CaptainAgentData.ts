/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezCaptainAgentLibEntry } from "@waldiez/models/Agent/Captain/types";
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
} from "@waldiez/models/Agent/Common";

export class WaldiezAgentCaptainData extends WaldiezAgentData {
    agentLib: WaldiezCaptainAgentLibEntry[];
    toolLib: "default" | null;
    maxRound: number;
    maxTurns: number;

    constructor(
        props: {
            humanInputMode: WaldiezAgentHumanInputMode;
            systemMessage: string | null;
            codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
            agentDefaultAutoReply: string | null;
            maxConsecutiveAutoReply: number | null;
            termination: WaldiezAgentTerminationMessageCheck;
            modelIds: string[];
            skills: WaldiezAgentLinkedSkill[];
            parentId?: string;
            nestedChats: WaldiezAgentNestedChat[];
            agentLib: WaldiezCaptainAgentLibEntry[];
            toolLib: "default" | null;
            maxRound: number;
            maxTurns: number;
        } = {
            humanInputMode: "NEVER",
            systemMessage: null,
            codeExecutionConfig: false,
            agentDefaultAutoReply: null,
            maxConsecutiveAutoReply: null,
            termination: {
                type: "none",
                keywords: [],
                criterion: null,
                methodContent: null,
            },
            modelIds: [],
            skills: [],
            parentId: undefined,
            nestedChats: [],
            agentLib: [],
            toolLib: null,
            maxRound: 10,
            maxTurns: 5,
        },
    ) {
        super(props);
        this.agentLib = props.agentLib;
        this.toolLib = props.toolLib;
        this.maxRound = props.maxRound;
        this.maxTurns = props.maxTurns;
    }
}
