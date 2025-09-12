/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { SnackbarItem } from "@waldiez/components/snackbar/types";

export const Snackbar: React.FC<SnackbarItem & { onClose: () => void }> = ({
    flowId,
    message,
    level = "info",
    details,
    withCloseButton,
    onClose,
}) => {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    const resolveSnackbarContainer = (flowId?: string): HTMLElement => {
        const isVisible = (el: HTMLElement) => {
            if (el.classList.contains("hidden")) {
                return false;
            }
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        };

        // Look inside the modal portal root first
        const modalRoot = document.getElementById("modal-root") || document.body;
        if (flowId && modalRoot) {
            const nodes = Array.from(
                modalRoot.querySelectorAll<HTMLElement>(".modal .modal-content[data-flow-id]"),
            );
            // find the last visible content matching this flowId
            for (let i = nodes.length - 1; i >= 0; i--) {
                const el = nodes[i];
                if (el && el.dataset?.flowId === flowId && isVisible(el)) {
                    return el;
                }
            }
        }

        // Fallbacks identical to your original
        return (
            document.getElementById(`rf-root-${flowId}`) ??
            document.getElementById(`${flowId}-modal`) ??
            document.body
        );
    };

    useLayoutEffect(() => {
        setContainer(resolveSnackbarContainer(flowId));
    }, [flowId]);

    if (!container) {
        return null;
    }

    const getErrorMessage = (details: any): string => {
        if (details instanceof Error) {
            return details.message;
        }
        if (typeof details === "string") {
            return details;
        }
        if (typeof details === "object" && details !== null) {
            if ("detail" in details && typeof details.detail === "string") {
                return details.detail;
            }
            if ("message" in details && typeof details.message === "string") {
                return details.message;
            }
            if ("statusText" in details && typeof details.statusText === "string") {
                return `Error: ${details.statusText}`;
            }
            try {
                return JSON.stringify(details, null, 2);
            } catch {
                return String(details);
            }
        }
        return "An unexpected error occurred.";
    };

    const showDetails = details && !(typeof details === "string" && details.length <= 50);

    return createPortal(
        <div
            className={`snackbar show ${level} ${details ? "with-details" : ""}`}
            role="alert"
            aria-live={level === "error" ? "assertive" : "polite"}
            id={`${flowId}-snackbar`}
            data-testid="snackbar"
        >
            <div className="message" data-testid="snackbar-message">
                {message}
            </div>
            {details &&
                (!showDetails ? (
                    <span className="details-content" data-testid="snackbar-details">
                        {details}
                    </span>
                ) : (
                    <details>
                        <summary>Details</summary>
                        <div className="details-content" data-testid="snackbar-details">
                            {getErrorMessage(details)}
                        </div>
                    </details>
                ))}
            {withCloseButton && (
                <button
                    className="close"
                    aria-label="Close notification"
                    type="button"
                    onClick={onClose}
                    data-testid="snackbar-close"
                >
                    &times;
                </button>
            )}
        </div>,
        container,
    );
};
