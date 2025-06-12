/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { importItem } from "@waldiez/utils";

describe("importItem", () => {
    it("should import an item", () => {
        const itemGetter = () => ({ id: "1" });
        const onLoad = vi.fn();
        const event = {
            target: {
                files: [new File(["{}"], "test.json", { type: "application/json" })],
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        importItem(event, itemGetter, onLoad);
        waitFor(() => expect(onLoad).toHaveBeenCalled());
    });
    it("should not import an item", () => {
        const itemGetter = () => null;
        const onLoad = vi.fn();
        const event = {
            target: {
                files: [new File(["{}"], "test.json", { type: "application/json" })],
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        importItem(event, itemGetter, onLoad);
        waitFor(() => expect(onLoad).not.toHaveBeenCalled());
    });
    it("should not import an invalid json", () => {
        const itemGetter = () => ({ id: "1" });
        const onLoad = vi.fn();
        const event = {
            target: {
                files: [
                    new File(["{invalid: json}"], "test.json", {
                        type: "application/json",
                    }),
                ],
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        importItem(event, itemGetter, onLoad);
        const errorSpy = vi.spyOn(console, "error");
        waitFor(() => expect(onLoad).not.toHaveBeenCalled());
        waitFor(() => expect(errorSpy).toHaveBeenCalled());
    });
});
