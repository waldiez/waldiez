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
import { WaldiezRagUserRetrieveConfig } from "@waldiez/models/Agent/RagUser/types";

export const defaultRetrieveConfig: WaldiezRagUserRetrieveConfig = {
    task: "default",
    vectorDb: "chroma",
    dbConfig: {
        model: "all-MiniLM-L6-v2",
        useMemory: false,
        useLocalStorage: false,
        localStoragePath: null,
        connectionUrl: null,
        waitUntilIndexReady: null,
        waitUntilDocumentReady: null,
        metadata: null,
    },
    docsPath: [],
    newDocs: true,
    model: null,
    chunkTokenSize: null,
    contextMaxTokens: null,
    chunkMode: "multi_lines",
    mustBreakAtEmptyLine: true,
    useCustomEmbedding: false,
    embeddingFunction: null,
    customizedPrompt: null,
    customizedAnswerPrefix: null,
    updateContext: true,
    collectionName: "autogen-docs",
    getOrCreate: true,
    overwrite: false,
    useCustomTokenCount: false,
    customTokenCountFunction: null,
    useCustomTextSplit: false,
    customTextSplitFunction: null,
    customTextTypes: [],
    recursive: true,
    distanceThreshold: -1,
    nResults: null,
};
/**
 * Waldiez Rag User Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "SOMETIMES")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The model ids of the agent
 * @param skills - The linked skills of the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param retrieveConfig - The retrieve configuration of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedSkill}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezRagUserRetrieveConfig}
 * @see {@link defaultRetrieveConfig}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 */
export class WaldiezAgentRagUserData extends WaldiezAgentData {
    retrieveConfig: WaldiezRagUserRetrieveConfig;

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
            retrieveConfig: WaldiezRagUserRetrieveConfig;
        } = {
            humanInputMode: "ALWAYS",
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
            retrieveConfig: defaultRetrieveConfig,
        },
    ) {
        super(props);
        this.retrieveConfig = props.retrieveConfig;
    }
}
