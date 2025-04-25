/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getNodePositionFromJSON } from "@waldiez/models/mappers/common/common";

describe("getNodePositionFromJSON", () => {
    it("should return the position value", () => {
        expect(getNodePositionFromJSON({ position: { x: 0, y: 0 } })).toEqual({ x: 0, y: 0 });
        expect(getNodePositionFromJSON({ position: { x: 1, y: 1 } })).toEqual({ x: 1, y: 1 });
        expect(getNodePositionFromJSON({ position: { x: 2, y: 2 } })).toEqual({ x: 2, y: 2 });
        expect(getNodePositionFromJSON({ position: { x: -1, y: -1 } })).toEqual({ x: -1, y: -1 });
        expect(getNodePositionFromJSON({ position: { x: 1.5, y: 1.5 } })).toEqual({ x: 1.5, y: 1.5 });
        expect(getNodePositionFromJSON({ position: { x: "1", y: "1" } })).toEqual({ x: 20, y: 20 });
        expect(getNodePositionFromJSON({ position: { x: "1.5", y: "1.5" } })).toEqual({ x: 20, y: 20 });
        expect(getNodePositionFromJSON({} as any)).toEqual({ x: 20, y: 20 });
    });
    it("should return the position value with custom position", () => {
        expect(getNodePositionFromJSON({ position: { x: 0, y: 0 } }, { x: 1, y: 1 })).toEqual({ x: 0, y: 0 });
        expect(getNodePositionFromJSON({ position: { x: 1, y: 1 } }, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
        expect(getNodePositionFromJSON({ position: { x: 2, y: 2 } }, { x: 1, y: 1 })).toEqual({ x: 2, y: 2 });
        expect(getNodePositionFromJSON({ position: { x: -1, y: -1 } }, { x: 1, y: 1 })).toEqual({
            x: -1,
            y: -1,
        });
        expect(getNodePositionFromJSON({ position: { x: 1.5, y: 1.5 } }, { x: 1, y: 1 })).toEqual({
            x: 1.5,
            y: 1.5,
        });
        expect(getNodePositionFromJSON({ position: { x: "1", y: "1" } }, { x: 1, y: 1 })).toEqual({
            x: 1,
            y: 1,
        });
        expect(getNodePositionFromJSON({ position: { x: "1.5", y: "1.5" } }, { x: 1, y: 1 })).toEqual({
            x: 1,
            y: 1,
        });
        expect(getNodePositionFromJSON({} as any, { x: 1, y: 1 })).toEqual({ x: 1, y: 1 });
    });
    it("should check for position in .rest", () => {
        expect(getNodePositionFromJSON({ rest: { position: { x: 0, y: 0 } } })).toEqual({ x: 0, y: 0 });
        expect(getNodePositionFromJSON({ rest: { position: { x: 1, y: 1 } } })).toEqual({ x: 1, y: 1 });
        expect(getNodePositionFromJSON({ rest: { position: { x: 2, y: 2 } } })).toEqual({ x: 2, y: 2 });
        expect(getNodePositionFromJSON({ rest: { position: { x: -1, y: -1 } } })).toEqual({ x: -1, y: -1 });
        expect(getNodePositionFromJSON({ rest: { position: { x: 1.5, y: 1.5 } } })).toEqual({
            x: 1.5,
            y: 1.5,
        });
        expect(getNodePositionFromJSON({ rest: { position: { x: "1", y: "1" } } })).toEqual({ x: 20, y: 20 });
        expect(getNodePositionFromJSON({ rest: { position: { x: "1.5", y: "1.5" } } })).toEqual({
            x: 20,
            y: 20,
        });
        expect(getNodePositionFromJSON({ rest: {} as any })).toEqual({ x: 20, y: 20 });
    });
});
