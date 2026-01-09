/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { emptyFlow } from "@waldiez/models/Flow";
import { flowMapper } from "@waldiez/models/mappers";

describe("flowMapper", () => {
    it("should return an empty flow if no json is provided", () => {
        const flow = flowMapper.importFlow("'");
        expect(flow).toEqual(emptyFlow);
    });
});
