/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
} from "@waldiez/models/Agent/Common";
import { WaldiezReasoningAgentReasonConfig } from "@waldiez/models/Agent/Reasoning/types";

export const defaultReasonConfig: WaldiezReasoningAgentReasonConfig = {
    method: "beam_search",
    maxDepth: 3,
    forestSize: 1,
    ratingScale: 10,
    beamSize: 3,
    answerApproach: "pool",
    nsim: 3,
    explorationConstant: 1.41,
};

export class WaldiezAgentReasoningData extends WaldiezAgentData {
    verbose: boolean;
    reasonConfig: WaldiezReasoningAgentReasonConfig;

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
            verbose: boolean;
            reasonConfig: WaldiezReasoningAgentReasonConfig;
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
            verbose: true,
            reasonConfig: defaultReasonConfig,
        },
    ) {
        super(props);
        this.verbose = props.verbose;
        this.reasonConfig = props.reasonConfig;
    }
}
