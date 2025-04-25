/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderEdge } from "./common";
import { edgeProps, flowId } from "./data";
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

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
    afterEach(() => {
        (HTMLDialogElement.prototype.showModal as any).mockClear();
    });
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
        expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should change the tab in the modal", () => {
        renderEdge("chat", { order: 3 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-message-${edgeProps.id}`);
        fireEvent.click(tab);
    });
});

describe("WaldiezEdgeNested", () => {
    afterEach(() => {
        (HTMLDialogElement.prototype.showModal as any).mockClear();
    });
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
        expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should change the tab in the modal", () => {
        renderEdge("nested", { order: 3 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-${edgeProps.id}`);
        fireEvent.click(tab);
    });
    it("should change the nested sub-tab in the modal", () => {
        renderEdge("nested", { order: 4 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const tab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-${edgeProps.id}`);
        fireEvent.click(tab);
        const subTab = screen.getByTestId(`tab-id-we-${flowId}-edge-nested-chat-${edgeProps.id}-reply`);
        fireEvent.click(subTab);
    });
});

describe("WaldiezEdgeGroup", () => {
    afterEach(() => {
        (HTMLDialogElement.prototype.showModal as any).mockClear();
    });
    it("should render", () => {
        renderEdge("group", { order: "invalid" }, false);
    });
    it("should call delete edge", () => {
        renderEdge("group", { order: 1 }, false);
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`delete-edge-${edgeProps.id}`));
    });
    it("should open the edge modal", () => {
        renderEdge("group", { order: 2 }, false);
        expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
        const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
        fireEvent.click(toGainFocus);
        fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
        const dialog = screen.getByTestId(`edge-modal-${edgeProps.id}`);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
        expect(dialog).not.toBeNull();
        const closeBtn = dialog.querySelector(".modal-close-btn");
        expect(closeBtn).not.toBeNull();
    });
});

describe("WaldiezEdgeSwarm", () => {
    afterEach(() => {
        (HTMLDialogElement.prototype.showModal as any).mockClear();
    });
    ["trigger", "handoff", "nested"].forEach(type => {
        it(`should render a swarm ${type}`, () => {
            renderEdge("swarm", { order: "invalid" }, false, type as "trigger" | "handoff" | "nested");
        });
        it(`should not be hidden for swarm ${type}`, () => {
            renderEdge("swarm", { order: 1 }, false, type as "trigger" | "handoff" | "nested");
            expect(screen.queryByTestId(`edge-${edgeProps.id}-box`)).not.toBeNull();
        });
        it(`should open the edge modal for swarm ${type}`, () => {
            renderEdge("swarm", { order: 2 }, false, type as "trigger" | "handoff" | "nested");
            expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
            const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
            fireEvent.click(toGainFocus);
            const idToClick = `open-edge-modal-${edgeProps.id}`;
            fireEvent.click(screen.getByTestId(idToClick));
            // fireEvent.click(screen.getByTestId(`open-edge-modal-${edgeProps.id}`));
            const dialog = screen.getByTestId(`edge-modal-${edgeProps.id}`);
            expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
            expect(dialog).not.toBeNull();
            const closeBtn = dialog.querySelector(".modal-close-btn");
            expect(closeBtn).not.toBeNull();
        });
        it(`should call delete edge for swarm ${type}`, () => {
            renderEdge("swarm", { order: 3 }, false, type as "trigger" | "handoff" | "nested");
            const toGainFocus = screen.getByTestId(`edge-${edgeProps.id}-box`);
            fireEvent.click(toGainFocus);
            fireEvent.click(screen.getByTestId(`delete-edge-${edgeProps.id}`));
        });
    });
});
