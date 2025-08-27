/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback, useMemo, useState } from "react";
import { FaStepForward } from "react-icons/fa";
import { FaBug, FaChevronDown, FaChevronUp, FaPlay, FaStop, FaX } from "react-icons/fa6";

import { nanoid } from "nanoid";

import { WaldiezStepByStep, controlToResponse } from "@waldiez/components/stepByStep/types";

type StepByStepViewProps = {
    flowId: string;
    stepByStep?: WaldiezStepByStep | null;
    className?: string;
};

/**
 * Main step-by-step debug view component
 */
// eslint-disable-next-line complexity
export const StepByStepView: React.FC<StepByStepViewProps> = ({ stepByStep }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [responseText, setResponseText] = useState("");
    const canClose = typeof stepByStep?.handlers?.close === "function" && stepByStep?.eventHistory.length > 0;
    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setResponseText(e.target.value);
    }, []);
    const onInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                stepByStep?.handlers.respond({
                    id: nanoid(),
                    timestamp: Date.now(),
                    data: responseText,
                    request_id: stepByStep?.activeRequest?.request_id,
                    type: "input_response",
                });
                setResponseText("");
            }
        },
        [responseText, stepByStep?.handlers, stepByStep?.activeRequest?.request_id],
    );
    const onRespond = useCallback(() => {
        stepByStep?.handlers.respond({
            id: nanoid(),
            timestamp: Date.now(),
            data: responseText,
            request_id: stepByStep?.activeRequest?.request_id,
            type: "input_response",
        });
        setResponseText("");
    }, [responseText, stepByStep?.activeRequest?.request_id, stepByStep?.handlers]);
    const onControl = useCallback(
        (
            action:
                | "continue"
                | "step"
                | "run"
                | "quit"
                | "info"
                | "help"
                | "stats"
                | "add_breakpoint"
                | "remove_breakpoint"
                | "list_breakpoints"
                | "clear_breakpoints",
        ) => {
            const response = controlToResponse({ kind: action });
            stepByStep?.handlers.sendControl({
                data: response,
                request_id: stepByStep?.activeRequest?.request_id || "<unknown>",
            });
        },
        [stepByStep?.handlers, stepByStep?.activeRequest?.request_id],
    );
    // let's try to reduce the envt history's data (keep only .data or .content, or .message if available)
    const reducedHistory = useMemo(() => {
        if (!stepByStep?.eventHistory) {
            return [];
        }
        return stepByStep?.eventHistory
            .filter(entry => !["debug", "print", "raw"].includes(String(entry.type)))
            .map(entry => ({
                data: entry.event || entry.data || entry.message || entry.content || entry,
            }))
            .map(entry => {
                if (Array.isArray(entry.data) && entry.data.length === 1) {
                    return entry.data[0];
                }
                return entry.data;
            }) as any[];
    }, [stepByStep?.eventHistory]);

    const getBadgeText = (stepByStep?: WaldiezStepByStep | null, history?: any[]) => {
        if (!stepByStep || !stepByStep.currentEvent) {
            return null;
        }
        if (!stepByStep.active && history && history.length > 0) {
            return "Finished";
        }
        if (typeof stepByStep.currentEvent?.type === "string") {
            return stepByStep.currentEvent.type;
        }
        if (typeof stepByStep.currentEvent === "object") {
            return "Running";
        }
        if (!history || history.length === 0) {
            return null;
        }
        const topEvent = history[0];
        if (typeof topEvent.event?.type === "string") {
            return topEvent.event.type;
        }
        return topEvent.type || "Running";
    };
    const badgeText = getBadgeText(stepByStep, reducedHistory);
    if (!stepByStep?.active && !canClose) {
        return null;
    }
    return (
        <div className="waldiez-step-by-step-view">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <FaBug className="icon-bug" size={18} />
                    <div className="title">Step-by-step Panel</div>
                    {!stepByStep?.active && <div className="badge">Finished</div>}
                    {stepByStep?.active && badgeText && (
                        <div className={`badge ${badgeText}`}>{badgeText}</div>
                    )}
                </div>
                <div className="header-right">
                    <button
                        title={isExpanded ? "Collapse" : "Expand"}
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="header-toggle"
                    >
                        {isExpanded ? <FaChevronDown size={14} /> : <FaChevronUp size={14} />}
                    </button>

                    {!stepByStep?.active && canClose && (
                        <button
                            title="Close"
                            type="button"
                            onClick={stepByStep?.handlers?.close}
                            className="header-toggle"
                        >
                            <FaX size={14} />
                        </button>
                    )}
                </div>
            </div>
            {/* Content */}
            {isExpanded && (
                <div className="content">
                    {/* Controls (if pending action) */}
                    {stepByStep?.pendingControlInput && (
                        <div className="controls">
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={() => onControl("continue")}
                            >
                                <FaStepForward /> <span>Continue</span>
                            </button>
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => onControl("run")}
                            >
                                <FaPlay /> <span>Run</span>
                            </button>
                            <button
                                className="btn btn-danger"
                                type="button"
                                onClick={() => onControl("quit")}
                            >
                                <FaStop /> <span>Quit</span>
                            </button>
                        </div>
                    )}

                    {/* Pending input */}
                    {stepByStep?.activeRequest && (
                        <div className="card card--pending">
                            <div className="card-title">Waiting for input</div>
                            <div className="codeblock">{stepByStep.activeRequest.prompt}</div>
                            <div className="input-row">
                                <input
                                    className="input"
                                    placeholder="Type your response… (Enter to send)"
                                    value={responseText}
                                    type={stepByStep.activeRequest.password === true ? "password" : "text"}
                                    onChange={onInputChange}
                                    onKeyDown={onInputKeyDown}
                                />
                                <button className="btn btn-primary" type="button" onClick={onRespond}>
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Event history / raw logs */}
                    <div className="event-history">
                        <SectionTitle>Messages</SectionTitle>
                        <JsonArea value={reducedHistory} placeholder="No messages yet" />
                    </div>
                </div>
            )}
        </div>
    );
};

function safeStringify(v: unknown) {
    try {
        return JSON.stringify(v, null, 2);
    } catch {
        return String(v);
    }
}
const JsonArea: React.FC<{ value?: unknown; placeholder?: string }> = ({ value, placeholder = "" }) => {
    let safeValue: string;
    if (Array.isArray(value)) {
        const entries = [];
        for (let i = 0; i < value.length; i += 1) {
            const entry = value[i];
            if (entry.event) {
                entries.push(safeStringify(entry.event));
            } else if (entry.content) {
                entries.push(safeStringify(entry.content));
            } else {
                entries.push(safeStringify(entry));
            }
        }
        safeValue = entries.join("\n");
    } else {
        safeValue = safeStringify(value);
    }
    if (
        !safeValue ||
        safeValue === "undefined" ||
        safeValue === "null" ||
        safeValue.trim() === "" ||
        safeValue === "[]" ||
        safeValue === "{}"
    ) {
        safeValue = placeholder;
    }
    return (
        <div className="json">
            <pre className="pre">{safeValue}</pre>
        </div>
    );
};
const SectionTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div className="section-title margin-bottom-5">{children}</div>
);

StepByStepView.displayName = "WaldiezStepByStepView";
