/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

/**
 * Shows a snackbar message for a given flow view.
 * @param flowId - The id of the flow to show the snackbar for.
 * @param message - The message to show in the snackbar.
 * @param level - The level of the snackbar. Can be 'info', 'warning', 'error' or 'success'. Defaults to 'info'.
 * @param details - The details of the snackbar. Can be a string or an Error object. Defaults to null.
 * @param duration - The duration in milliseconds to show the snackbar for. If not provided, and includeCloseButton is false, defaults to 3000ms.
 */

const DEFAULT_SNACKBAR_DURATION = 3000;

export const showSnackbar = (
    flowId: string,
    message: string,
    level: "info" | "warning" | "error" | "success" = "info",
    details: string | Error | object | null = null,
    duration: number | undefined = undefined,
    withCloseButton: boolean = false,
) => {
    if (isSnackbarLocked(flowId)) {
        setTimeout(() => showSnackbar(flowId, message, level, details, duration, withCloseButton), 200);
        return;
    }

    setSnackbarLock(flowId, true);
    const { showCloseButton, autoDismiss, dismissAfter } = computeSnackbarBehavior(withCloseButton, duration);
    createOrUpdateSnackbar(flowId, message, level, details, showCloseButton);

    if (autoDismiss) {
        scheduleSnackbarRemoval(flowId, dismissAfter);
    } else {
        setSnackbarLock(flowId, false);
    }
};

const computeSnackbarBehavior = (
    withCloseButton: boolean,
    duration: number | undefined,
): {
    showCloseButton: boolean;
    autoDismiss: boolean;
    dismissAfter: number;
} => {
    const showCloseButton = withCloseButton;
    const autoDismiss = duration !== undefined || !withCloseButton;
    const dismissAfter = duration ?? DEFAULT_SNACKBAR_DURATION;
    return { showCloseButton, autoDismiss, dismissAfter };
};

const getFlowRoot = (flowId: string, fallbackToBody = false): HTMLElement | null => {
    // First, try to get the flow-specific root element
    let flowRoot = document.getElementById(`rf-root-${flowId}`);
    // If not found and fallback is allowed, use body
    if (!flowRoot && fallbackToBody) {
        flowRoot = document.body;
    }
    if (!flowRoot) {
        return null;
    }
    // Look for an open modal within this root element
    const modalContent = flowRoot.querySelector("dialog[open] .modal-content") as HTMLElement;
    return modalContent || flowRoot;
};

const scheduleSnackbarRemoval = (flowId: string, duration: number | undefined) => {
    const rootDiv = getFlowRoot(flowId, true);
    if (!rootDiv || !duration) {
        return;
    }
    setTimeout(() => {
        setSnackbarLock(flowId, false);
        rootDiv.querySelector(`#${flowId}-snackbar`)?.remove();
    }, duration);
};

const isSnackbarLocked = (flowId: string): boolean =>
    Boolean(window.localStorage.getItem(`snackbar-${flowId}.lock`));

const setSnackbarLock = (flowId: string, locked: boolean) => {
    locked
        ? window.localStorage.setItem(`snackbar-${flowId}.lock`, "1")
        : window.localStorage.removeItem(`snackbar-${flowId}.lock`);
};
const createOrUpdateSnackbar = (
    flowId: string,
    message: string,
    level: string,
    details: string | Error | object | null,
    includeCloseButton: boolean,
) => {
    const rootDiv = getFlowRoot(flowId, true);
    if (rootDiv) {
        const snackbar = getOrCreateSnackbarElement(flowId, rootDiv);
        const haveDetails = checkForDetails(details);
        snackbar.className = `show snackbar ${level} ${haveDetails ? "with-details" : ""}`;

        snackbar.textContent = "";
        appendSnackbarMessage(snackbar, message);
        appendSnackbarDetails(snackbar, details);

        if (includeCloseButton) {
            addSnackbarCloseButton(snackbar, level, flowId);
        }
    }
};

const checkForDetails = (details: string | Error | object | null): boolean => {
    if ((typeof details === "string" && details.length > 0) || details instanceof Error) {
        return true;
    }
    if (details && Object.keys(details).length > 0) {
        return true;
    }
    return false;
};

const getOrCreateSnackbarElement = (flowId: string, rootDiv: HTMLElement): HTMLElement => {
    let snackbar = rootDiv.querySelector(`#${flowId}-snackbar`) as HTMLElement;
    if (!snackbar) {
        snackbar = document.createElement("div");
        snackbar.id = `${flowId}-snackbar`;
        rootDiv.appendChild(snackbar);
    }
    return snackbar;
};

const appendSnackbarMessage = (snackbar: HTMLElement, message: string) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    messageDiv.textContent = message;
    snackbar.appendChild(messageDiv);
};

const appendSnackbarDetails = (snackbar: HTMLElement, details: string | Error | object | null) => {
    if (!details) {
        return;
    }

    const detailsElement = document.createElement("details");
    const summaryElement = document.createElement("summary");
    summaryElement.textContent = "Details";
    detailsElement.appendChild(summaryElement);

    const detailsContent = document.createElement("div");
    detailsContent.textContent = getErrorMessage(details);
    detailsElement.appendChild(detailsContent);

    snackbar.appendChild(detailsElement);
};

const getErrorMessage = (error: any): string => {
    if (typeof error === "string") {
        return error;
    }
    if (error.detail) {
        return error.detail;
    }
    if (error.message) {
        return error.message;
    }
    if (error.statusText) {
        return `Error: ${error.statusText}`;
    }
    return "An unexpected error occurred.";
};

const addSnackbarCloseButton = (snackbar: HTMLElement, level: string, flowId: string) => {
    const closeButton = document.createElement("div");
    closeButton.className = "close clickable";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = () => {
        snackbar.className = `hide snackbar ${level}`;
        setTimeout(() => {
            snackbar.remove();
            setSnackbarLock(flowId, false);
        }, 300);
    };
    snackbar.appendChild(closeButton);
};
