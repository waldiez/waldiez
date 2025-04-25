/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getFlowRoot } from "@waldiez/utils";

describe("getFlowRoot", () => {
    it("should return a div", () => {
        const flowId = "test";
        document.body.innerHTML = `<div id="rf-root-${flowId}"></div>`;
        const rootDiv = getFlowRoot(flowId);
        expect(rootDiv).toEqual(document.getElementById(`rf-root-${flowId}`));
    });
    it("should return body", () => {
        const flowId = "test";
        document.body.innerHTML = "";
        const rootDiv = getFlowRoot(flowId, true);
        expect(rootDiv).toEqual(document.body);
    });
    it("should return null", () => {
        const flowId = "test";
        document.body.innerHTML = "";
        const rootDiv = getFlowRoot(flowId);
        expect(rootDiv).toEqual(null);
    });
});
