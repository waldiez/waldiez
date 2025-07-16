/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { page, userEvent } from "@vitest/browser/context";
import { Waldiez } from "@waldiez";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("All", () => {
    const removeTapHighlight = () => {
        // it seems that chromium injects:
        // '-webkit-tap-highlight-color: rgba(0, 0, 0, 0);'
        // in the style attribute of some elements
        // (in some cases)
        // so the snapshots might be different
        for (const el of document.querySelectorAll("[style]")) {
            const original = el.getAttribute("style") ?? "";
            const cleaned = original
                .replace(/-webkit-tap-highlight-color:\s*rgba\(0,\s*0,\s*0,\s*0\);?/gi, "")
                .trim();
            if (cleaned) {
                el.setAttribute("style", cleaned);
            } else {
                el.removeAttribute("style");
            }
        }
    };

    it("should render Waldiez components", async () => {
        const screen = render(<Waldiez flowId="test-flow" storageId="test-flow-storage" />);
        removeTapHighlight();
        const agents = page.getByText(/Agents/i);
        const models = page.getByText(/Models/i);
        const tools = page.getByText(/Tools/i);
        await expect.element(agents).toBeInTheDocument();
        await expect.element(models).toBeInTheDocument();
        await expect.element(tools).toBeInTheDocument();
        expect(screen).toMatchSnapshot();
        await sleep(100);
        await userEvent.click(models);
        await sleep(1000);
        // click on add model
        const addModel = page.getByText(/Add Model/i);
        await userEvent.click(addModel);
        await sleep(1000);
        // await page.screenshot({ path: "root.png" });
        // await sleep(1000);
    });
});
