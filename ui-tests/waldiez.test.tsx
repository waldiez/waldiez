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
    // eslint-disable-next-line max-statements
    it("should render Waldiez components", async () => {
        const screen = render(<Waldiez flowId="test-flow" storageId="test-flow-storage" />);
        const agents = page.getByText(/Agents/i);
        const models = page.getByText(/Models/i);
        const skills = page.getByText(/Skills/i);
        await expect.element(agents).toBeInTheDocument();
        await expect.element(models).toBeInTheDocument();
        await expect.element(skills).toBeInTheDocument();
        expect(screen).toMatchSnapshot();
        await sleep(100);
        await userEvent.click(models);
        await sleep(1000);
        // click on add model
        const addModel = page.getByText(/Add Model/i);
        await userEvent.click(addModel);
        await sleep(1000);
        // await page.screenshot({ path: 'root.png' });
        // await sleep(1000);
    });
});
