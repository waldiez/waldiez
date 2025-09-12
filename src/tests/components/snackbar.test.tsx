/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import React from "react";

import { Snackbar, SnackbarProvider, showSnackbar, useSnackbar } from "@waldiez/components/snackbar";

const FLOW_ID = "test-flow";

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div id={`rf-root-${FLOW_ID}`} className="flow-wrapper">
        <SnackbarProvider>{children}</SnackbarProvider>
    </div>
);

beforeEach(() => {
    // Cleanup any snackbar items in DOM before each test
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

    it("queues multiple snackbar elements and shows them in order", async () => {
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
        const modalRoot = document.createElement("div");
        modalRoot.id = `${FLOW_ID}-modal`;
        modalRoot.className = "modal-root";

        const modal = document.createElement("div");
        modal.className = "modal";

        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";
        modalContent.setAttribute("data-flow-id", FLOW_ID);

        modal.appendChild(modalContent);
        modalRoot.appendChild(modal);
        document.body.appendChild(modalRoot);

        render(
            <Wrapper>
                <div />
            </Wrapper>,
        );

        act(() => {
            showSnackbar({
                flowId: FLOW_ID,
                message: "Modal Snackbar",
                level: "info",
            });
        });

        const snackbar = await screen.findByText("Modal Snackbar");
        expect(snackbar).toBeInTheDocument();
        expect(modalContent.contains(snackbar)).toBe(true);
    });
    describe("Snackbar fallback container", () => {
        it("renders in document.body if rf-root-<flowId> does not exist", () => {
            // Remove any custom root to ensure fallback
            const flowId = "no-root";
            render(
                <Snackbar
                    id={`rf-root-${flowId}`}
                    flowId={flowId}
                    message="Body fallback"
                    onClose={() => {}}
                />,
            );

            // Snackbar should render in body
            const snackbar = screen.queryByTestId("snackbar");
            expect(snackbar).toBeInTheDocument();
            // Check its parentNode is body or a child of body (since createPortal appends to container)
            expect(snackbar?.ownerDocument.body.contains(snackbar)).toBe(true);
        });
    });
    describe("Snackbar details rendering (getErrorMessage logic)", () => {
        const baseProps = {
            id: "snackbar-test",
            flowId: "test",
            message: "irrelevant",
            onClose: () => {},
        };
        it("renders string details directly", () => {
            render(<Snackbar {...baseProps} details="simple string" />);
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent("simple string");
        });

        it("renders .detail property if present", () => {
            render(<Snackbar {...baseProps} details={{ detail: "Fine print!" }} />);
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent("Fine print!");
        });

        it("renders .message property if present", () => {
            render(<Snackbar {...baseProps} details={{ message: "Boom!" }} />);
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent("Boom!");
        });

        it("renders .statusText property if present", () => {
            render(<Snackbar {...baseProps} details={{ statusText: "Not Found" }} />);
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent("Error: Not Found");
        });

        it("renders stringified object if no known property", () => {
            render(<Snackbar {...baseProps} details={{ foo: "bar", val: 2 }} />);
            // This will be a JSON string
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent('{ "foo": "bar", "val": 2 }');
        });

        // cspell: disable-next-line
        it("renders fallback for non-stringifiable detail", () => {
            const circular: any = {};
            circular.me = circular;
            render(<Snackbar {...baseProps} details={circular} />);
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent("[object Object]");
        });

        it("renders fallback message for unknown details", () => {
            render(<Snackbar {...baseProps} details={undefined} />);
            // Should not render the details span at all if details is undefined
            expect(screen.queryByTestId("snackbar-details")).toBeNull();
        });

        it("renders for non-object, non-string details", () => {
            // @ts-expect-error not a valid type for details
            render(<Snackbar {...baseProps} details={42} />);
            expect(screen.getByTestId("snackbar-details")).toHaveTextContent("An unexpected error occurred.");
        });
    });
});
