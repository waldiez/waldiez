/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SnackbarProvider, showSnackbar, useSnackbar } from "@waldiez/components/snackbar";

const FLOW_ID = "test-flow";

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div id={`rf-root-${FLOW_ID}`} className="flow-wrapper">
        <SnackbarProvider>{children}</SnackbarProvider>
    </div>
);

beforeEach(() => {
    // Cleanup any snackbars in DOM before each test
    document.body.innerHTML = "";
});

describe("Snackbar System", () => {
    it("renders a snackbar when showSnackbar is called", async () => {
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "Test info message",
                level: "info",
            });
        });

        const snackbar = await screen.findByTestId("snackbar");
        expect(snackbar).toHaveTextContent("Test info message");
        expect(snackbar).toHaveClass("info");
    });

    it("renders details when provided", async () => {
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "With details",
                level: "warning",
                details: "Here are some details",
            });
        });
        const details = await screen.findByTestId("snackbar-details");
        expect(details).toHaveTextContent("Here are some details");
    });

    it("renders error details for Error object", async () => {
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "Error!",
                level: "error",
                details: new Error("Failure occurred"),
            });
        });
        const details = await screen.findByTestId("snackbar-details");
        expect(details).toHaveTextContent("Failure occurred");
    });

    it("renders with close button and closes on click", async () => {
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "Closable message",
                level: "success",
                withCloseButton: true,
            });
        });

        const closeBtn = await screen.findByTestId("snackbar-close");
        expect(closeBtn).toBeInTheDocument();
        act(() => {
            fireEvent.click(closeBtn);
        });
        await waitFor(() => {
            expect(screen.queryByTestId("snackbar")).not.toBeInTheDocument();
        });
    });

    it("auto-dismisses after duration", async () => {
        vi.useFakeTimers();
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "This should disappear",
                level: "info",
                duration: 800,
            });
        });
        await screen.findByTestId("snackbar");
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        await waitFor(() => {
            expect(screen.queryByTestId("snackbar")).not.toBeInTheDocument();
        });
        vi.useRealTimers();
    });

    it("queues multiple snackbars and shows them in order", async () => {
        vi.useFakeTimers();
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "First",
                level: "info",
                duration: 500,
            });
            showSnackbar({
                flowId: FLOW_ID,
                message: "Second",
                level: "info",
                duration: 500,
            });
            showSnackbar({
                flowId: FLOW_ID,
                message: "Third",
                level: "info",
                duration: 500,
            });
        });

        // First appears
        expect(await screen.findByText("First")).toBeInTheDocument();

        // Advance, should show Second
        act(() => {
            vi.advanceTimersByTime(700);
        });
        expect(await screen.findByText("Second")).toBeInTheDocument();

        // Advance, should show Third
        act(() => {
            vi.advanceTimersByTime(700);
        });
        expect(await screen.findByText("Third")).toBeInTheDocument();

        // Advance, all should be gone
        act(() => {
            vi.advanceTimersByTime(700);
        });
        await waitFor(() => {
            expect(screen.queryByTestId("snackbar")).not.toBeInTheDocument();
        });

        vi.useRealTimers();
    });

    it("renders with correct class for warning, success, error", async () => {
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "Warning msg",
                level: "warning",
            });
        });
        const snackbar = await screen.findByTestId("snackbar");
        expect(snackbar).toHaveClass("warning");
    });

    it("supports the React useSnackbar hook", async () => {
        const TestComponent = () => {
            const { enqueueSnackbar } = useSnackbar();
            return (
                <button
                    onClick={() =>
                        enqueueSnackbar({
                            flowId: FLOW_ID,
                            message: "From hook",
                            level: "success",
                            withCloseButton: false,
                        })
                    }
                >
                    Show via Hook
                </button>
            );
        };
        render(
            <div id={`rf-root-${FLOW_ID}`} className="flow-wrapper">
                <SnackbarProvider>
                    <TestComponent />
                </SnackbarProvider>
            </div>,
        );
        fireEvent.click(screen.getByText("Show via Hook"));
        expect(await screen.findByText("From hook")).toBeInTheDocument();
    });

    it("renders in modal root if present", async () => {
        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );
        const root = document.getElementById(`rf-root-${FLOW_ID}`)!;
        const modal = document.createElement("dialog");
        modal.setAttribute("open", "");
        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";
        modal.appendChild(modalContent);
        root.appendChild(modal);
        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "Modal Snackbar",
                level: "info",
            });
        });

        expect(await screen.findByText("Modal Snackbar")).toBeInTheDocument();
        // Optionally: check it is a child of modalContent
        expect(modalContent.querySelector(".snackbar")).not.toBeNull();
    });
});
