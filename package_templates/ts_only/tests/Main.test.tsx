import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Main } from "@my/package/components";

describe("Main Component", () => {
    it("renders correctly", () => {
        const { getByText, getByTestId } = render(<Main />);
        expect(getByText("App")).toBeInTheDocument();
        expect(getByTestId("toggle-theme-button")).toBeInTheDocument();
    });

    it("handles user input correctly", () => {
        const { getByTestId } = render(<Main />);
        const input = getByTestId("user-input");
        fireEvent.change(input, { target: { value: "John" } });
        expect(input).toHaveValue("John");
    });

    it("toggles input visibility", () => {
        const { getByTestId } = render(<Main />);
        const toggleButton = getByTestId("toggle-user-input-visibility-button");

        expect(getByTestId("user-input")).toHaveAttribute("type", "text");

        fireEvent.click(toggleButton);
        expect(getByTestId("user-input")).toHaveAttribute("type", "password");
    });

    it("greets user", () => {
        const { getByTestId } = render(<Main />);
        const input = getByTestId("user-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.click(getByTestId("greet-button"));
        expect(getByTestId("result")).toHaveTextContent("Hello, Alice!");
    });
    it("toggles theme correctly", () => {
        const { getByTestId } = render(<Main />);
        const toggleButton = getByTestId("toggle-theme-button");
        fireEvent.click(toggleButton);
        expect(document.body.classList.contains("dark-theme")).toBe(true);
    });
    it("handles Enter key correctly", () => {
        const { getByTestId } = render(<Main />);
        const input = getByTestId("user-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getByTestId("result")).toHaveTextContent("Hello, Alice!");
    });
    it("handles Escape key correctly", () => {
        const { getByTestId } = render(<Main />);
        const input = getByTestId("user-input");
        fireEvent.change(input, { target: { value: "Alice" } });
        fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
        expect(input).toHaveValue("");
    });
});
