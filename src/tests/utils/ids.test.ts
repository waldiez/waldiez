/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getId } from "@waldiez/utils";

describe("getId", () => {
    it("should return a string", () => {
        expect(getId()).toEqual(expect.any(String));
    });
    it("should return a unique string", () => {
        const id1 = getId();
        const id2 = getId();
        expect(id1).not.toEqual(id2);
    });
});
