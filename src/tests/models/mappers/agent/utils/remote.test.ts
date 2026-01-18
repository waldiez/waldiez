/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getRemoteAgentClient, getRemoteAgentServer } from "@waldiez/models/mappers/agent/utils/remote";

describe("getRemoteAgentServer", () => {
    it("should return disabled server if no server in data", () => {
        expect(getRemoteAgentServer({})).toEqual({
            enabled: false,
            config: null,
        });
    });

    it("should return disabled server if enabled is not a boolean", () => {
        expect(getRemoteAgentServer({ server: { enabled: "true" } })).toEqual({
            enabled: false,
            config: null,
        });
    });

    it("should return disabled server if enabled is false", () => {
        expect(getRemoteAgentServer({ server: { enabled: false } })).toEqual({
            enabled: false,
            config: null,
        });
    });

    it("should return enabled server with null config if no config provided", () => {
        expect(getRemoteAgentServer({ server: { enabled: true } })).toEqual({
            enabled: true,
            config: null,
        });
    });

    it("should return enabled server with empty config if config is empty object", () => {
        expect(getRemoteAgentServer({ server: { enabled: true, config: {} } })).toEqual({
            enabled: true,
            config: {
                url: null,
                agentCard: null,
                cardModifier: null,
                extendedAgentCard: null,
                extendedCardModifier: null,
            },
        });
    });

    it("should parse url from config", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { url: "http://example.com" },
            },
        });
        expect(result.config?.url).toEqual("http://example.com");
    });

    it("should not parse url if not a string", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { url: 123 },
            },
        });
        expect(result.config?.url).toEqual(null);
    });

    it("should parse cardModifier from config", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { cardModifier: "def modify(card): return card" },
            },
        });
        expect(result.config?.cardModifier).toEqual("def modify(card): return card");
    });

    it("should not parse cardModifier if not a string", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { cardModifier: 123 },
            },
        });
        expect(result.config?.cardModifier).toEqual(null);
    });

    it("should parse extendedCardModifier from config", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { extendedCardModifier: "def modify(card, ctx): return card" },
            },
        });
        expect(result.config?.extendedCardModifier).toEqual("def modify(card, ctx): return card");
    });

    it("should not parse extendedCardModifier if not a string", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { extendedCardModifier: null },
            },
        });
        expect(result.config?.extendedCardModifier).toEqual(null);
    });

    it("should parse agentCard from config", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: {
                    agentCard: {
                        name: "Test Agent",
                        description: "A test agent",
                    },
                },
            },
        });
        expect(result.config?.agentCard?.name).toEqual("Test Agent");
        expect(result.config?.agentCard?.description).toEqual("A test agent");
    });

    it("should not parse agentCard if not an object", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: "invalid" },
            },
        });
        expect(result.config?.agentCard).toEqual(null);
    });

    it("should not parse agentCard if null", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: null },
            },
        });
        expect(result.config?.agentCard).toEqual(null);
    });

    it("should parse extendedAgentCard from config", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: {
                    extendedAgentCard: {
                        name: "Extended Agent",
                        url: "http://extended.example.com",
                    },
                },
            },
        });
        expect(result.config?.extendedAgentCard?.name).toEqual("Extended Agent");
        expect(result.config?.extendedAgentCard?.url).toEqual("http://extended.example.com");
    });

    it("should not parse extendedAgentCard if not an object", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { extendedAgentCard: [] },
            },
        });
        expect(result.config?.extendedAgentCard).toEqual(null);
    });

    it("should parse full server config", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: {
                    url: "http://example.com",
                    agentCard: {
                        name: "Agent",
                        description: "Description",
                        version: "1.0.0",
                    },
                    cardModifier: "def modify(card): return card",
                    extendedAgentCard: {
                        name: "Extended Agent",
                    },
                    extendedCardModifier: "def modify(card, ctx): return card",
                },
            },
        });
        expect(result).toEqual({
            enabled: true,
            config: {
                url: "http://example.com",
                agentCard: {
                    name: "Agent",
                    description: "Description",
                    url: null,
                    version: "1.0.0",
                    defaultInputModes: [],
                    defaultOutputModes: [],
                    capabilities: {
                        streaming: true,
                        pushNotifications: true,
                        extensions: [],
                    },
                    skills: [],
                },
                cardModifier: "def modify(card): return card",
                extendedAgentCard: {
                    name: "Extended Agent",
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
                },
                extendedCardModifier: "def modify(card, ctx): return card",
            },
        });
    });
});

describe("getRemoteAgentClient", () => {
    it("should return null values if no client in data", () => {
        expect(getRemoteAgentClient({})).toEqual({
            url: null,
            name: null,
            silent: null,
            maxReconnects: null,
            pollingInterval: null,
            headers: {},
        });
    });

    it("should return null values if client is not an object", () => {
        expect(getRemoteAgentClient({ client: "invalid" })).toEqual({
            url: null,
            name: null,
            silent: null,
            maxReconnects: null,
            pollingInterval: null,
            headers: {},
        });
    });

    it("should parse url from client", () => {
        const result = getRemoteAgentClient({ client: { url: "http://client.example.com" } });
        expect(result.url).toEqual("http://client.example.com");
    });

    it("should not parse url if not a string", () => {
        const result = getRemoteAgentClient({ client: { url: 123 } });
        expect(result.url).toEqual(null);
    });

    it("should parse name from client", () => {
        const result = getRemoteAgentClient({ client: { name: "TestClient" } });
        expect(result.name).toEqual("TestClient");
    });

    it("should not parse name if not a string", () => {
        const result = getRemoteAgentClient({ client: { name: {} } });
        expect(result.name).toEqual(null);
    });

    it("should parse silent as boolean true", () => {
        const result = getRemoteAgentClient({ client: { silent: true } });
        expect(result.silent).toEqual(true);
    });

    it("should parse silent as boolean false", () => {
        const result = getRemoteAgentClient({ client: { silent: false } });
        expect(result.silent).toEqual(false);
    });

    it("should parse silent as string 'true'", () => {
        const result = getRemoteAgentClient({ client: { silent: "true" } });
        expect(result.silent).toEqual(true);
    });

    it("should parse silent as string 'TRUE'", () => {
        const result = getRemoteAgentClient({ client: { silent: "TRUE" } });
        expect(result.silent).toEqual(true);
    });

    it("should parse silent as string 'false'", () => {
        const result = getRemoteAgentClient({ client: { silent: "false" } });
        expect(result.silent).toEqual(false);
    });

    it("should not parse silent if not boolean or string", () => {
        const result = getRemoteAgentClient({ client: { silent: 123 } });
        expect(result.silent).toEqual(null);
    });

    it("should parse maxReconnects as integer", () => {
        const result = getRemoteAgentClient({ client: { maxReconnects: 5 } });
        expect(result.maxReconnects).toEqual(5);
    });

    it("should parse maxReconnects from float", () => {
        const result = getRemoteAgentClient({ client: { maxReconnects: 5.7 } });
        expect(result.maxReconnects).toEqual(5);
    });

    it("should parse maxReconnects from string", () => {
        const result = getRemoteAgentClient({ client: { maxReconnects: "10" } });
        expect(result.maxReconnects).toEqual(10);
    });

    it("should not parse maxReconnects if not a valid number", () => {
        const result = getRemoteAgentClient({ client: { maxReconnects: "invalid" } });
        expect(result.maxReconnects).toEqual(null);
    });

    it("should parse pollingInterval as float", () => {
        const result = getRemoteAgentClient({ client: { pollingInterval: 1.5 } });
        expect(result.pollingInterval).toEqual(1.5);
    });

    it("should parse pollingInterval from integer", () => {
        const result = getRemoteAgentClient({ client: { pollingInterval: 2 } });
        expect(result.pollingInterval).toEqual(2);
    });

    it("should parse pollingInterval from string", () => {
        const result = getRemoteAgentClient({ client: { pollingInterval: "3.14" } });
        expect(result.pollingInterval).toEqual(3.14);
    });

    it("should not parse pollingInterval if not a valid number", () => {
        const result = getRemoteAgentClient({ client: { pollingInterval: "invalid" } });
        expect(result.pollingInterval).toEqual(null);
    });

    it("should parse full client config", () => {
        const result = getRemoteAgentClient({
            client: {
                url: "http://client.example.com",
                name: "TestClient",
                silent: true,
                maxReconnects: 5,
                pollingInterval: 1.5,
            },
        });
        expect(result).toEqual({
            url: "http://client.example.com",
            name: "TestClient",
            silent: true,
            maxReconnects: 5,
            pollingInterval: 1.5,
            headers: {},
        });
    });
    it("should parse headers from client", () => {
        const result = getRemoteAgentClient({
            client: { headers: { Authorization: "Bearer token", "X-Custom": "value" } },
        });
        expect(result.headers).toEqual({ Authorization: "Bearer token", "X-Custom": "value" });
    });

    it("should return empty object if headers is not an object", () => {
        const result = getRemoteAgentClient({ client: { headers: "invalid" } });
        expect(result.headers).toEqual({});
    });

    it("should return empty object if headers is an array", () => {
        const result = getRemoteAgentClient({ client: { headers: ["a", "b"] } });
        expect(result.headers).toEqual({});
    });

    it("should return empty object if headers is null", () => {
        const result = getRemoteAgentClient({ client: { headers: null } });
        expect(result.headers).toEqual({});
    });

    it("should parse full client config with headers", () => {
        const result = getRemoteAgentClient({
            client: {
                url: "http://client.example.com",
                name: "TestClient",
                silent: true,
                maxReconnects: 5,
                pollingInterval: 1.5,
                headers: { "Content-Type": "application/json" },
            },
        });
        expect(result).toEqual({
            url: "http://client.example.com",
            name: "TestClient",
            silent: true,
            maxReconnects: 5,
            pollingInterval: 1.5,
            headers: { "Content-Type": "application/json" },
        });
    });
});

describe("getRemoteAgentCard (via getRemoteAgentServer)", () => {
    const getAgentCard = (cardData: any) => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: cardData },
            },
        });
        return result.config?.agentCard;
    };

    it("should return default values for empty card", () => {
        const card = getAgentCard({});
        expect(card).toEqual({
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
        });
    });

    it("should parse name", () => {
        const card = getAgentCard({ name: "TestAgent" });
        expect(card?.name).toEqual("TestAgent");
    });

    it("should not parse name if not a string", () => {
        const card = getAgentCard({ name: 123 });
        expect(card?.name).toEqual(null);
    });

    it("should parse description", () => {
        const card = getAgentCard({ description: "A test agent description" });
        expect(card?.description).toEqual("A test agent description");
    });

    it("should not parse description if not a string", () => {
        const card = getAgentCard({ description: [] });
        expect(card?.description).toEqual(null);
    });

    it("should parse url", () => {
        const card = getAgentCard({ url: "http://agent.example.com" });
        expect(card?.url).toEqual("http://agent.example.com");
    });

    it("should not parse url if not a string", () => {
        const card = getAgentCard({ url: null });
        expect(card?.url).toEqual(null);
    });

    it("should parse version", () => {
        const card = getAgentCard({ version: "1.2.3" });
        expect(card?.version).toEqual("1.2.3");
    });

    it("should not parse version if not a string", () => {
        const card = getAgentCard({ version: 123 });
        expect(card?.version).toEqual(null);
    });

    it("should parse defaultInputModes", () => {
        const card = getAgentCard({ defaultInputModes: ["text/plain", "application/json"] });
        expect(card?.defaultInputModes).toEqual(["text/plain", "application/json"]);
    });

    it("should filter non-string values from defaultInputModes", () => {
        const card = getAgentCard({ defaultInputModes: ["text/plain", 123, "application/json", null] });
        expect(card?.defaultInputModes).toEqual(["text/plain", "application/json"]);
    });

    it("should return empty array if defaultInputModes is not an array", () => {
        const card = getAgentCard({ defaultInputModes: "text/plain" });
        expect(card?.defaultInputModes).toEqual([]);
    });

    it("should parse defaultOutputModes", () => {
        const card = getAgentCard({ defaultOutputModes: ["text/html", "image/png"] });
        expect(card?.defaultOutputModes).toEqual(["text/html", "image/png"]);
    });

    it("should filter non-string values from defaultOutputModes", () => {
        const card = getAgentCard({ defaultOutputModes: ["text/html", {}, "image/png"] });
        expect(card?.defaultOutputModes).toEqual(["text/html", "image/png"]);
    });

    it("should return empty array if defaultOutputModes is not an array", () => {
        const card = getAgentCard({ defaultOutputModes: null });
        expect(card?.defaultOutputModes).toEqual([]);
    });

    it("should parse skills array", () => {
        const card = getAgentCard({ skills: ["skill-1", "skill-2", "skill-3"] });
        expect(card?.skills).toEqual(["skill-1", "skill-2", "skill-3"]);
    });

    it("should filter non-string values from skills", () => {
        const card = getAgentCard({ skills: ["skill-1", 123, "skill-2", null, "skill-3"] });
        expect(card?.skills).toEqual(["skill-1", "skill-2", "skill-3"]);
    });

    it("should return empty array if skills is not an array", () => {
        const card = getAgentCard({ skills: "skill-1" });
        expect(card?.skills).toEqual([]);
    });
});

describe("getRemoteAgentCard capabilities (via getRemoteAgentServer)", () => {
    const getCapabilities = (capabilitiesData: any) => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: { capabilities: capabilitiesData } },
            },
        });
        return result.config?.agentCard?.capabilities;
    };

    it("should return default capabilities if not provided", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: {} },
            },
        });
        expect(result.config?.agentCard?.capabilities).toEqual({
            streaming: true,
            pushNotifications: true,
            extensions: [],
        });
    });

    it("should parse capabilities with boolean streaming", () => {
        const capabilities = getCapabilities({ streaming: true });
        expect(capabilities?.streaming).toEqual(true);
    });

    it("should parse capabilities with boolean streaming false", () => {
        const capabilities = getCapabilities({ streaming: false });
        expect(capabilities?.streaming).toEqual(false);
    });

    it("should parse capabilities with string streaming 'true'", () => {
        const capabilities = getCapabilities({ streaming: "true" });
        expect(capabilities?.streaming).toEqual(true);
    });

    it("should parse capabilities with string streaming 'false'", () => {
        const capabilities = getCapabilities({ streaming: "false" });
        expect(capabilities?.streaming).toEqual(false);
    });

    it("should parse capabilities with boolean pushNotifications", () => {
        const capabilities = getCapabilities({ pushNotifications: true });
        expect(capabilities?.pushNotifications).toEqual(true);
    });

    it("should parse capabilities with boolean pushNotifications false", () => {
        const capabilities = getCapabilities({ pushNotifications: false });
        expect(capabilities?.pushNotifications).toEqual(false);
    });

    it("should parse capabilities with string pushNotifications 'true'", () => {
        const capabilities = getCapabilities({ pushNotifications: "true" });
        expect(capabilities?.pushNotifications).toEqual(true);
    });

    it("should parse capabilities with string pushNotifications 'false'", () => {
        const capabilities = getCapabilities({ pushNotifications: "false" });
        expect(capabilities?.pushNotifications).toEqual(false);
    });

    it("should return empty extensions if not an array", () => {
        const capabilities = getCapabilities({ extensions: "invalid" });
        expect(capabilities?.extensions).toEqual([]);
    });

    it("should parse valid extensions", () => {
        const capabilities = getCapabilities({
            extensions: [
                {
                    uri: "ext://example",
                    description: "Example extension",
                    required: true,
                    params: { key: "value" },
                },
            ],
        });
        expect(capabilities?.extensions).toEqual([
            {
                uri: "ext://example",
                description: "Example extension",
                required: true,
                params: { key: "value" },
            },
        ]);
    });

    it("should filter extensions without uri", () => {
        const capabilities = getCapabilities({
            extensions: [
                { description: "No URI extension", required: false },
                { uri: "ext://valid", description: "Valid extension" },
            ],
        });
        expect(capabilities?.extensions).toHaveLength(1);
        expect(capabilities?.extensions[0]?.uri).toEqual("ext://valid");
    });

    it("should filter non-object extensions", () => {
        const capabilities = getCapabilities({
            extensions: ["invalid", null, { uri: "ext://valid" }, 123],
        });
        expect(capabilities?.extensions).toHaveLength(1);
        expect(capabilities?.extensions[0]?.uri).toEqual("ext://valid");
    });

    it("should use default values for missing extension properties", () => {
        const capabilities = getCapabilities({
            extensions: [{ uri: "ext://minimal" }],
        });
        expect(capabilities?.extensions).toEqual([
            {
                uri: "ext://minimal",
                description: "",
                required: false,
                params: {},
            },
        ]);
    });

    it("should not parse extension params if not an object", () => {
        const capabilities = getCapabilities({
            extensions: [{ uri: "ext://test", params: "invalid" }],
        });
        expect(capabilities?.extensions[0]?.params).toEqual({});
    });

    it("should not parse extension params if null", () => {
        const capabilities = getCapabilities({
            extensions: [{ uri: "ext://test", params: null }],
        });
        expect(capabilities?.extensions[0]?.params).toEqual({});
    });

    it("should parse multiple extensions", () => {
        const capabilities = getCapabilities({
            extensions: [
                { uri: "ext://first", description: "First" },
                { uri: "ext://second", required: true },
                { uri: "ext://third", params: { foo: "bar" } },
            ],
        });
        expect(capabilities?.extensions).toHaveLength(3);
        expect(capabilities?.extensions[0]?.uri).toEqual("ext://first");
        expect(capabilities?.extensions[1]?.uri).toEqual("ext://second");
        expect(capabilities?.extensions[2]?.uri).toEqual("ext://third");
    });

    it("should not parse capabilities if not an object", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: { capabilities: "invalid" } },
            },
        });
        // Should keep default capabilities
        expect(result.config?.agentCard?.capabilities).toEqual({
            streaming: true,
            pushNotifications: true,
            extensions: [],
        });
    });

    it("should not parse capabilities if null", () => {
        const result = getRemoteAgentServer({
            server: {
                enabled: true,
                config: { agentCard: { capabilities: null } },
            },
        });
        expect(result.config?.agentCard?.capabilities).toEqual({
            streaming: true,
            pushNotifications: true,
            extensions: [],
        });
    });
});
