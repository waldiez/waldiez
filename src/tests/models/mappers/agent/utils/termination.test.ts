/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getTermination } from "@waldiez/models/mappers/agent/utils/termination";

describe("getTermination", () => {
    it("should return the termination", () => {
        const termination = getTermination({
            termination: {
                type: "keyword",
                keywords: ["end"],
                criterion: "ending",
                methodContent: "end",
            },
        });
        expect(termination).toEqual({
            type: "keyword",
            keywords: ["end"],
            criterion: "ending",
            methodContent: "end",
        });
    });
    it("should return the default termination", () => {
        const termination = getTermination({});
        expect(termination).toEqual({
            type: "none",
            keywords: [],
            criterion: null,
            methodContent: null,
        });
    });
    it("should return the default termination type if invalid", () => {
        const termination = getTermination({
            termination: {
                type: "invalid",
                keywords: ["end"],
                criterion: "ending",
                methodContent: "end",
            },
        });
        expect(termination).toEqual({
            type: "none",
            keywords: ["end"],
            criterion: "ending",
            methodContent: "end",
        });
    });
    it("should return the default termination criterion if invalid", () => {
        const termination = getTermination({
            termination: {
                type: "keyword",
                keywords: ["end"],
                criterion: "invalid",
                methodContent: "end",
            },
        });
        expect(termination).toEqual({
            type: "keyword",
            keywords: ["end"],
            criterion: null,
            methodContent: "end",
        });
    });
    it("should return the default termination method content if the key is missing", () => {
        const termination = getTermination({
            termination: {
                type: "keyword",
                keywords: ["end"],
                criterion: "ending",
            },
        });
        expect(termination).toEqual({
            type: "keyword",
            keywords: ["end"],
            criterion: "ending",
            methodContent: null,
        });
    });
});
