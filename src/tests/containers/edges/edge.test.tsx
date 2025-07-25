/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderEdge } from "./common";
import { edgeProps, flowId } from "./data";

describe("WaldiezEdgeHidden", () => {
    it("should render", () => {
        renderEdge("hidden", { order: 0 });
    });
    it("should be hidden", () => {
        renderEdge("hidden", { order: 2 });
        expect(screen.queryByTestId(`edge-${edgeProps.id}-box`)).toBeNull();
    });
});

describe("WaldiezEdgeChat", () => {
    it("should render", () => {
        renderEdge("chat", { order: "invalid" }, false);
    });
    it("should blur on second click", () => {
        renderEdge("chat", { order: 0 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        expect(toGainFocus).toHaveFocus();
        fireEvent.click(toGainFocus);
        expect(toGainFocus).not.toHaveFocus();
    });
    it("should call delete edge", () => {
        renderEdge("chat", { order: 1 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`delete-edge-${edgeProps.id}`));
    });
    it("should open the edge modal", () => {
        renderEdge("chat", { order: 2 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
    });
    it("should change the tab in the modal", () => {
        renderEdge("chat", { order: 3 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
    });
});

describe("WaldiezEdgeNested", () => {
    it("should render", () => {
        renderEdge("nested", { order: "invalid" }, false);
    });
    it("should call delete edge", () => {
        renderEdge("nested", { order: 1 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`delete-edge-${edgeProps.id}`));
    });
    it("should open the edge modal", () => {
        renderEdge("nested", { order: 2 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
    });
    it("should change the tab in the modal", () => {
        renderEdge("nested", { order: 3 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-nested-${edgeProps.id}`);
        fireEvent.click(tab);
    });
    it("should change the nested sub-tab in the modal", () => {
        renderEdge("nested", { order: 4 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const tab = screen.getByTestId(`tab-id-wc-${flowId}-edge-nested-${edgeProps.id}`);
        fireEvent.click(tab);
        const subTab = screen.getByTestId(`tab-id-wc-${flowId}-edge-nested-chat-${edgeProps.id}-reply`);
        fireEvent.click(subTab);
    });
});
