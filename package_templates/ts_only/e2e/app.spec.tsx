/* eslint-disable max-statements */
import { act, screen } from "@testing-library/react";
import { userEvent } from "@vitest/browser/context";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { App } from "@my/package/App";
import "@my/package/index.css";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("App E2E Tests", () => {
    it("renders correctly", async () => {
        act(() => {
            render(<App />);
        });
        expect(screen.getByText("App")).toBeInTheDocument();
        expect(screen).toMatchSnapshot();
        expect(screen.getByTestId("toggle-theme-button")).toBeInTheDocument();
        // toggle theme
        await sleep(1000);
        const toggleButton = screen.getByTestId("toggle-theme-button");
        await act(async () => {
            await userEvent.click(toggleButton);
        });
        expect(document.body.classList.contains("dark-theme")).toBe(true);
        await sleep(1000);
        const { getByTestId } = screen;
        const input = getByTestId("user-input");
        expect(getByTestId("user-input")).toHaveAttribute("type", "text");
        await act(async () => {
            await userEvent.type(input, "Alice");
        });
        expect(input).toHaveValue("Alice");
        await sleep(1000);
        await act(async () => {
            await userEvent.click(getByTestId("toggle-user-input-visibility-button"));
        });
        expect(getByTestId("user-input")).toHaveAttribute("type", "password");
        await sleep(1000);
        // submit
        await act(async () => {
            await userEvent.click(getByTestId("greet-button"));
        });
        expect(getByTestId("result")).toHaveTextContent("Hello, Alice!");
        await sleep(1000);
        // await page.screenshot({ path: "main.png" });
    });
});
