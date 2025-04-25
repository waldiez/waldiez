/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { Waldiez } from "@waldiez";
import { describe, expect, it } from "vitest";

describe("Waldiez", () => {
    it("renders a Waldiez flow", () => {
        render(<Waldiez />);
        const agents = screen.getByText(/Agents/i);
        const models = screen.getByText(/Models/i);
        const skills = screen.getByText(/Skills/i);
        expect(agents).toBeInTheDocument();
        expect(models).toBeInTheDocument();
        expect(skills).toBeInTheDocument();
    });
    it("renders error boundary", () => {
        //eslint-disable-next-line
        // @ts-ignore
        render(<Waldiez nodes={[{ invalid: "node" }]} />);
        const errorBoundary = screen.getByTestId("error-boundary");
        expect(errorBoundary).toBeInTheDocument();
    });
});
