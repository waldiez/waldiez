/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    WaldiezAgent,
    WaldiezChat,
    WaldiezEdgeType,
    WaldiezNodeAgentSwarm,
    WaldiezNodeAgentSwarmContainer,
    agentMapper,
    chatMapper,
} from "@waldiez/models";
import {
    exportSwarmAgents,
    getEdgeTrigger,
    getSwarmContainer,
} from "@waldiez/models/mappers/flow/utils/swarm";

import { waldiezFlow } from "./data";

describe("getSwarmContainer", () => {
    it("should return a new swarm container if not in nodes", () => {
        const container = getSwarmContainer(waldiezFlow, []);
        const common = agentMapper.asNode(WaldiezAgent.create("swarm_container"));
        expect(container).toEqual({
            ...common,
            id: `swarm-container-${waldiezFlow.id}`,
            data: {
                ...common.data,
                description: "Swarm container",
                createdAt: waldiezFlow.createdAt,
                updatedAt: waldiezFlow.updatedAt,
            },
            position: { x: 50, y: 50 },
        });
    });
    it("should return the existing swarm container", () => {
        const existing = agentMapper.asNode(WaldiezAgent.create("swarm_container"));
        delete (existing as any).data.label;
        const newFlow = structuredClone({
            ...waldiezFlow,
            nodes: [existing],
        });
        const container = getSwarmContainer(newFlow, newFlow.nodes);
        expect(container).toEqual({
            ...existing,
            id: `swarm-container-${waldiezFlow.id}`,
            data: {
                ...existing.data,
                label: "Swarm container",
                description: "Swarm container",
                createdAt: waldiezFlow.createdAt,
                updatedAt: waldiezFlow.updatedAt,
            },
            position: { x: 20, y: 20 },
        });
    });
});

describe("getEdgeTrigger", () => {
    it("should return an edge from user to container", () => {
        const node1 = agentMapper.asNode(WaldiezAgent.create("user"));
        const node2 = agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm;
        const containerNode = agentMapper.asNode(
            WaldiezAgent.create("swarm_container"),
        ) as WaldiezNodeAgentSwarmContainer;
        const allEdges = [
            {
                id: "edge1",
                source: node1.id,
                target: node2.id,
                type: "swarm" as WaldiezEdgeType,
                data: chatMapper.asEdge(WaldiezChat.create({ source: node1.id, target: node2.id })).data,
            },
        ];
        const edge = getEdgeTrigger(
            allEdges,
            [node1, node2, containerNode],
            node2,
            containerNode.data,
            containerNode.id,
        );
        expect(edge).not.toBeNull();
        expect(edge?.source).toBe(node1.id);
        expect(edge?.target).toBe(node2.id);
    });
    it("should return null if no edge from user to container", () => {
        const node1 = agentMapper.asNode(WaldiezAgent.create("user"));
        const node2 = agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm;
        const containerNode = agentMapper.asNode(
            WaldiezAgent.create("swarm_container"),
        ) as WaldiezNodeAgentSwarmContainer;
        const allEdges = [
            {
                id: "edge1",
                source: node1.id,
                target: node2.id,
                type: "swarm" as WaldiezEdgeType,
                data: chatMapper.asEdge(WaldiezChat.create({ source: node1.id, target: node2.id })).data,
            },
        ];
        const edge = getEdgeTrigger(
            allEdges,
            [node2, containerNode],
            node2,
            containerNode.data,
            containerNode.id,
        );
        expect(edge).toBeNull();
    });
    it("should use the container's initial agent if no edge from user to container", () => {
        const node1 = agentMapper.asNode(WaldiezAgent.create("swarm"));
        const node2 = agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm;
        const containerNode = agentMapper.asNode(
            WaldiezAgent.create("swarm_container"),
        ) as WaldiezNodeAgentSwarmContainer;
        (containerNode.data as any).initialAgent = node1.id;
        const allEdges = [
            {
                id: "edge1",
                source: node2.id,
                target: node1.id,
                type: "swarm" as WaldiezEdgeType,
                data: chatMapper.asEdge(WaldiezChat.create({ source: node2.id, target: node1.id })).data,
            },
        ];
        const edge = getEdgeTrigger(
            allEdges,
            [node1, node2, containerNode],
            node2,
            containerNode.data,
            node1.id,
        );
        expect(edge).not.toBeNull();
        expect(edge?.source).toBe(node2.id);
        expect(edge?.target).toBe(node1.id);
    });
});

describe("exportSwarmAgents", () => {
    it("should return empty if no swarm agents", () => {
        const { swarmAgents, edges } = exportSwarmAgents([], [], false);
        expect(swarmAgents).toEqual([]);
        expect(edges).toEqual([]);
    });
    it("should return empty if no swarm container", () => {
        const { swarmAgents, edges } = exportSwarmAgents(
            [agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm],
            [],
            false,
        );
        expect(swarmAgents).toEqual([]);
        expect(edges).toEqual([]);
    });
    it("should return empty if no initial agent", () => {
        const swarm = agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm;
        const container = agentMapper.asNode(
            WaldiezAgent.create("swarm_container"),
        ) as WaldiezNodeAgentSwarmContainer;
        const allEdges = [
            {
                id: "edge1",
                source: swarm.id,
                target: container.id,
                type: "swarm" as WaldiezEdgeType,
                data: chatMapper.asEdge(
                    WaldiezChat.create({
                        source: swarm.id,
                        target: container.id,
                    }),
                ).data,
            },
        ];
        const { swarmAgents, edges } = exportSwarmAgents([swarm], allEdges, false);
        expect(swarmAgents).toEqual([]);
        expect(edges).toEqual(allEdges);
    });
    it("should return the exported swarm agents", () => {
        const swarm1 = agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm;
        const swarm2 = agentMapper.asNode(WaldiezAgent.create("swarm")) as WaldiezNodeAgentSwarm;
        const container = agentMapper.asNode(
            WaldiezAgent.create("swarm_container"),
        ) as WaldiezNodeAgentSwarmContainer;
        const allEdges = [
            {
                id: "edge1",
                source: swarm1.id,
                target: swarm2.id,
                type: "swarm" as WaldiezEdgeType,
                data: chatMapper.asEdge(
                    WaldiezChat.create({
                        source: swarm1.id,
                        target: swarm2.id,
                    }),
                ).data,
            },
        ];
        const { swarmAgents, edges } = exportSwarmAgents([swarm1, swarm2, container], allEdges, false);
        const exportedSwarm1 = agentMapper.exportAgent(swarm1, false);
        expect(swarmAgents).toEqual([
            {
                ...exportedSwarm1,
                data: {
                    ...exportedSwarm1.data,
                    handoffs: [
                        {
                            available: {
                                type: "none",
                                value: null,
                            },
                            condition: "Transfer to Swarm",
                            targetType: "agent",
                            target: {
                                id: swarm2.id,
                                order: 0,
                            },
                        },
                    ],
                },
            },
            {
                ...agentMapper.exportAgent(swarm2, false),
            },
        ]);
        expect(edges).toEqual(allEdges);
    });
});
