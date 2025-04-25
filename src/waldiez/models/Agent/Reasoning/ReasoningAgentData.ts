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
    max_depth: 3,
    forest_size: 1,
    rating_scale: 10,
    beam_size: 3,
    answer_approach: "pool",
    nsim: 3,
    exploration_constant: 1.41,
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
            parentId: string | null;
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
            parentId: null,
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
