/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezAgentRemoteCard, WaldiezAgentRemoteServer } from "@waldiez/models/Agent/types";

// eslint-disable-next-line complexity
export const getRemoteAgentServer = (data: any) => {
    const server: {
        enabled: boolean;
        config?: WaldiezAgentRemoteServer | null;
    } = {
        enabled: false,
        config: null,
    };
    if ("server" in data) {
        if ("enabled" in data.server && typeof data.server.enabled === "boolean") {
            server.enabled = data.server.enabled;
        }
        if (server.enabled && "config" in data.server && data.server.config) {
            server.config = {
                url: null,
                agentCard: null,
                cardModifier: null,
                extendedAgentCard: null,
                extendedCardModifier: null,
            };
            if ("url" in data.server.config && typeof data.server.config.url === "string") {
                server.config.url = data.server.config.url;
            }
            if (
                "agentCard" in data.server.config &&
                typeof data.server.config.agentCard === "object" &&
                data.server.config.agentCard &&
                !Array.isArray(data.server.config.agentCard)
            ) {
                server.config.agentCard = _getRemoteAgentCard(data.server.config.agentCard);
            }
            if ("cardModifier" in data.server.config && typeof data.server.config.cardModifier === "string") {
                server.config.cardModifier = data.server.config.cardModifier;
            }
            if (
                "extendedAgentCard" in data.server.config &&
                typeof data.server.config.extendedAgentCard === "object" &&
                data.server.config.extendedAgentCard &&
                !Array.isArray(data.server.config.extendedAgentCard)
            ) {
                server.config.extendedAgentCard = _getRemoteAgentCard(data.server.config.extendedAgentCard);
            }
            if (
                "extendedCardModifier" in data.server.config &&
                typeof data.server.config.extendedCardModifier === "string"
            ) {
                server.config.extendedCardModifier = data.server.config.extendedCardModifier;
            }
        }
    }
    return server;
};

// eslint-disable-next-line max-statements
export const getRemoteAgentClient = (data: any) => {
    const client: {
        url?: string | null;
        name?: string | null;
        silent?: boolean | null;
        maxReconnects?: number | null;
        pollingInterval?: number | null;
        headers: { [k: string]: unknown };
    } = {
        url: null,
        name: null,
        silent: null,
        maxReconnects: null,
        pollingInterval: null,
        headers: {},
    };
    if ("client" in data && typeof data.client === "object") {
        if ("url" in data.client && typeof data.client.url === "string") {
            client.url = data.client.url;
        }
        if ("name" in data.client && typeof data.client.name === "string") {
            client.name = data.client.name;
        }
        if ("silent" in data.client) {
            if (typeof data.client.silent === "string") {
                client.silent = String(data.client.silent).toLowerCase() === "true";
            }
            if (typeof data.client.silent === "boolean") {
                client.silent = data.client.silent;
            }
        }
        if ("maxReconnects" in data.client) {
            const parsed = parseInt(data.client.maxReconnects, 10);
            if (!isNaN(parsed)) {
                client.maxReconnects = parsed;
            }
        }
        if ("pollingInterval" in data.client) {
            const parsed = parseFloat(data.client.pollingInterval);
            if (!isNaN(parsed)) {
                client.pollingInterval = parsed;
            }
        }
        if (
            "headers" in data.client &&
            typeof data.client.headers === "object" &&
            data.client.headers &&
            !Array.isArray(data.client.headers)
        ) {
            client.headers = data.client.headers;
        }
    }
    return client;
};

// eslint-disable-next-line max-statements, complexity
const _getRemoteAgentCard = (data: any): WaldiezAgentRemoteCard => {
    const agentCard: WaldiezAgentRemoteCard = {
        name: null,
        description: null,
        url: null,
        version: null,
        defaultInputModes: [],
        defaultOutputModes: [],
        capabilities: {
            streaming: true,
            pushNotifications: true,
            extensions: [],
        },
        skills: [],
    };
    if ("name" in data && typeof data.name === "string") {
        agentCard.name = data.name;
    }
    if ("description" in data && typeof data.description === "string") {
        agentCard.description = data.description;
    }
    if ("url" in data && typeof data.url === "string") {
        agentCard.url = data.url;
    }
    if ("version" in data && typeof data.version === "string") {
        agentCard.version = data.version;
    }
    if ("defaultInputModes" in data && Array.isArray(data.defaultInputModes)) {
        const cardInputModes: string[] = [];
        for (const inputMode of data.defaultInputModes) {
            if (typeof inputMode === "string") {
                cardInputModes.push(inputMode);
            }
        }
        agentCard.defaultInputModes = cardInputModes;
    }
    if ("defaultOutputModes" in data && Array.isArray(data.defaultOutputModes)) {
        const cardOutputModes: string[] = [];
        for (const outputMode of data.defaultOutputModes) {
            if (typeof outputMode === "string") {
                cardOutputModes.push(outputMode);
            }
        }
        agentCard.defaultOutputModes = cardOutputModes;
    }
    if ("capabilities" in data && typeof data.capabilities === "object" && data.capabilities) {
        agentCard.capabilities = {
            streaming: false,
            pushNotifications: false,
            extensions: [],
        };
        if ("streaming" in data.capabilities && typeof data.capabilities.streaming === "boolean") {
            agentCard.capabilities.streaming = data.capabilities.streaming;
        } else if ("streaming" in data.capabilities && typeof data.capabilities.streaming === "string") {
            agentCard.capabilities.streaming = String(data.capabilities.streaming).toLowerCase() === "true";
        }
        if (
            "pushNotifications" in data.capabilities &&
            typeof data.capabilities.pushNotifications === "boolean"
        ) {
            agentCard.capabilities.pushNotifications = data.capabilities.pushNotifications;
        } else if (
            "pushNotifications" in data.capabilities &&
            typeof data.capabilities.pushNotifications === "string"
        ) {
            agentCard.capabilities.pushNotifications =
                String(data.capabilities.pushNotifications).toLowerCase() === "true";
        }
        if ("extensions" in data.capabilities && Array.isArray(data.capabilities.extensions)) {
            for (const extension of data.capabilities.extensions) {
                if (typeof extension === "object" && extension) {
                    const ext: {
                        uri: string;
                        description: string;
                        required: boolean;
                        params: { [k: string]: unknown };
                    } = {
                        uri: "",
                        description: "",
                        required: false,
                        params: {},
                    };
                    if ("uri" in extension && typeof extension.uri === "string") {
                        ext.uri = extension.uri;
                    }
                    if ("description" in extension && typeof extension.description === "string") {
                        ext.description = extension.description;
                    }
                    if ("required" in extension && typeof extension.required === "boolean") {
                        ext.required = extension.required;
                    }
                    if ("params" in extension && typeof extension.params === "object" && extension.params) {
                        ext.params = extension.params;
                    }
                    if (ext.uri) {
                        agentCard.capabilities.extensions.push(ext);
                    }
                }
            }
        }
    }
    if ("skills" in data && Array.isArray(data.skills)) {
        for (const skill of data.skills) {
            if (typeof skill === "string") {
                agentCard.skills.push(skill);
            }
        }
    }
    return agentCard;
};
