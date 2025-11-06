/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Waldiez } from "@waldiez";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const tick = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

function stableHTML(root: HTMLElement) {
    let html = root.innerHTML;
    // normalize viewport pan
    html = html.replace(
        /(class="[^"]*(?:react-flow__viewport|xyflow__viewport)[^"]*".*?style="[^"]*?)transform:\s*translate3?d?\([^)]*\)\s*scale\([^)]*\)(.*?")/gs,
        "$1transform: translate(0px, 0px) scale(1)$2",
    );
    // normalize background pattern x/y (e.g., 50%20 => 10)
    html = html.replace(
        /(<pattern\b[^>]*?(?:id="pattern-[^"]+"|class="[^"]*react-flow__background-pattern[^"]*")[^>]*?)\s(x|y)="-?\d+"([^>]*>)/g,
        '$1 $2="0"$3',
    );
    // strip tap highlight noise if any
    html = html.replace(/-webkit-tap-highlight-color:\s*rgba\(0,\s*0,\s*0,\s*0\);?\s*/gi, "");
    return html;
}

describe("All", () => {
    // eslint-disable-next-line max-statements
    it("should render Waldiez components", async () => {
        document.body.classList.remove("waldiez-light");
        document.body.classList.add("waldiez-dark");
        const screen = await render(<Waldiez flowId="test-flow" storageId="test-flow-storage" />);
        Object.assign(document.body.style, { margin: "0", width: "100vw", height: "100vh" });
        await tick();
        const agents = page.getByText(/Agents/i);
        const models = page.getByText(/Models/i);
        const tools = page.getByText(/Tools/i);
        await expect.element(agents).toBeInTheDocument();
        await expect.element(models).toBeInTheDocument();
        await expect.element(tools).toBeInTheDocument();
        expect(stableHTML(screen.container)).toMatchSnapshot();
        await sleep(1000);
        await userEvent.click(models);
        await sleep(1000);
        // click on add model
        const addModel = page.getByText(/Add Model/i);
        await userEvent.click(addModel);
        await sleep(1000);
        await userEvent.dblClick(page.getByTitle("Edit Model"));
        await sleep(1000);
        await userEvent.click(page.getByTestId("modal-close-btn"));
        // click on add tool
        await sleep(1000);
        await userEvent.click(tools);
        const addTool = page.getByText(/Add Tool/i);
        await userEvent.click(addTool);
        await sleep(1000);
        await userEvent.dblClick(page.getByTitle("Edit Tool"));
        await sleep(1000);
        await userEvent.click(page.getByTestId("modal-close-btn"));
        await sleep(1000);
        // await page.screenshot();
    });
});
