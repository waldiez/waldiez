/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgentData } from "@waldiez/models/Agent/Common/AgentData";
import { WaldiezAgentType, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common/types";
import { capitalize, getId } from "@waldiez/utils";

// noinspection DuplicatedCode
/**
 * Waldiez Agent.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("user_proxy" | "assistant" | "rag_user_proxy" | "reasoning" | "captain" | "group_manager")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentData}
 */
export class WaldiezAgent {
    id: string;
    type = "agent";
    agentType: WaldiezNodeAgentType;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezAgentData;
    rest?: { [key: string]: unknown };

    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentData;
        rest?: { [key: string]: unknown };
    }) {
        this.id = props.id;
        this.agentType = props.agentType;
        this.name = props.name;
        this.description = props.description;
        this.tags = props.tags;
        this.requirements = props.requirements;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.data = props.data;
        this.rest = props.rest;
    }

    static create(agentType: WaldiezAgentType): WaldiezAgent {
        let name: string;
        let description: string;
        if (agentType === "group_manager") {
            name = "Manager";
            description = "The group manager agent";
        } else {
            name = capitalize(agentType.replace("_proxy", "").replace("_", " "));
            description = `A new ${name} agent`;
        }
        const agent = new WaldiezAgent({
            id: `wa-${getId()}`,
            agentType,
            name,
            description,
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: new WaldiezAgentData(),
        });
        updateAgentDataProps(agent, agentType);
        return agent;
    }
}

const updateAgentDataProps = (agent: WaldiezAgent, agentType: WaldiezAgentType) => {
    agent.data.humanInputMode = "NEVER";
    if (["user_proxy", "rag_user_proxy"].includes(agentType)) {
        agent.data.humanInputMode = "ALWAYS";
        if (agentType === "rag_user_proxy") {
            addRagUserProps(agent.data);
        }
    }
    if (agentType === "reasoning") {
        addReasoningProps(agent.data);
    }
    if (agentType === "captain") {
        addCaptainProps(agent.data);
    }
    if (agentType === "group_manager") {
        addGroupManagerProps(agent.data);
    }
};

const addRagUserProps = (agentData: WaldiezAgentData) => {
    (agentData as any).retrieveConfig = {
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
};

const addReasoningProps = (agentData: WaldiezAgentData) => {
    (agentData as any).verbose = true;
    (agentData as any).reasonConfig = {
        method: "beam_search",
        maxDepth: 3,
        forestSize: 1,
        ratingScale: 10,
        beamSize: 3,
        answerApproach: "pool",
        nsim: 3,
        explorationConstant: 1.41,
    };
};

const addCaptainProps = (agentData: WaldiezAgentData) => {
    (agentData as any).agentLib = [];
    (agentData as any).toolLib = null;
    (agentData as any).maxRound = 10;
    (agentData as any).maxTurns = 5;
};

const addGroupManagerProps = (agentData: WaldiezAgentData) => {
    (agentData as any).groupName = "Group";
    (agentData as any).maxRound = 20;
    (agentData as any).adminName = null;
    (agentData as any).contextVariables = {};
    (agentData as any).enableClearHistory = false;
    (agentData as any).sendIntroductions = false;
    (agentData as any).initialAgentId = undefined;
    (agentData as any).speakers = {
        selectionMethod: "auto",
        selectionCustomMethod: "",
        maxRetriesForSelecting: null,
        selectionMode: "repeat",
        allowRepeat: true,
        allowedOrDisallowedTransitions: {},
        transitionsType: "allowed",
    };
};
