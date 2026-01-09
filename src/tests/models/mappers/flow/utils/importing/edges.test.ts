/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getEdges } from "@waldiez/models/mappers/flow/utils/importing/edges";

describe("getEdges", () => {
    it("should return the correct edges", () => {
        const json = {
            edges: [
                {
                    id: "123",
                    type: "chat",
                    source: "456",
                    target: "789",
                    data: {},
                },
            ],
        };
        const edges = getEdges(json);
        expect(edges).toEqual([
            {
                id: "123",
                type: "chat",
                source: "456",
                target: "789",
                hidden: false,
                data: {},
            },
        ]);
    });
    it("should not return edges if edges is not an array", () => {
        const json = {
            edges: {},
        };
        const edges = getEdges(json);
        expect(edges).toEqual([]);
    });
    it("should not return edges if edges is not in the json", () => {
        const json = {};
        const edges = getEdges(json);
        expect(edges).toEqual([]);
    });
    it("should skip invalid edges", () => {
        const json = {
            edges: [
                {
                    id: "123",
                    type: "chat",
                    source: "456",
                    target: "789",
                    data: {},
                },
                {
                    id: "456",
                    type: "invalid",
                    source: "456",
                    target: "789",
                    data: {},
                },
                {
                    id: "789",
                    type: "chat",
                    source: "456",
                    target: "789",
                    data: {},
                },
            ],
        };
        const edges = getEdges(json);
        expect(edges).toEqual([
            {
                id: "123",
                type: "chat",
                source: "456",
                target: "789",
                hidden: false,
                data: {},
            },
            {
                id: "789",
                type: "chat",
                source: "456",
                target: "789",
                hidden: false,
                data: {},
            },
        ]);
    });
    it("should skip invalid edges", () => {
        const json = {
            edges: [
                {
                    id: "1",
                    type: "chat",
                    source: "wa-1",
                    target: "wa-2",
                    data: {},
                },
                {
                    id: 2,
                },
                {
                    id: "3",
                    type: 7,
                    source: "wa-1",
                    target: "wa-2",
                    data: {},
                },
                {
                    id: "4",
                    type: "other",
                    source: "wa-1",
                    target: "wa-2",
                    data: {},
                },
                {
                    id: "5",
                    type: "chat",
                    source: "wa-1",
                    data: {},
                },
                {
                    id: "6",
                    type: "chat",
                    target: "wa-2",
                    data: {},
                },
            ],
        };
        const edges = getEdges(json);
        expect(edges).toEqual([
            {
                id: "1",
                type: "chat",
                source: "wa-1",
                target: "wa-2",
                hidden: false,
                data: {},
            },
        ]);
    });
});
