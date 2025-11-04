/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import { type ChangeEvent, type FC, type KeyboardEvent, useCallback, useState } from "react";
import { FaStepForward } from "react-icons/fa";
import { FaCaretLeft, FaInfo, FaPlay, FaStop } from "react-icons/fa6";

import { nanoid } from "nanoid";

import { EventConsole, type WaldiezEvent } from "@waldiez/components/stepByStep/console";
import { EventAgentsList } from "@waldiez/components/stepByStep/eventAgentsList";
import { useAgentClassUpdates } from "@waldiez/components/stepByStep/hooks";
import { type WaldiezStepByStep, controlToResponse } from "@waldiez/components/stepByStep/types";
import { useWaldiez } from "@waldiez/store";

/**
 * Main step-by-step debug view component
 */
export const StepByStepView: FC<{
    flowId: string;
    isDarkMode: boolean;
    stepByStep?: WaldiezStepByStep | null;
    events: WaldiezEvent[];
    className?: string;
}> = ({ flowId, stepByStep, isDarkMode, events }) => {
    useAgentClassUpdates(stepByStep);
    const [responseText, setResponseText] = useState("");
    const [detailsViewActive, setDetailsViewActive] = useState(false);
    const resetActiveParticipants = useWaldiez(s => s.resetActiveParticipants);
    const resetActiveEventType = useWaldiez(s => s.resetActiveEventType);

    const requestId = stepByStep?.activeRequest?.request_id ?? null;
    const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setResponseText(e.target.value);
    }, []);

    const onRespond = useCallback(() => {
        if (!requestId) {
            return;
        }
        stepByStep?.handlers?.respond?.({
            id: nanoid(),
            timestamp: Date.now(),
            data: responseText,
            request_id: requestId,
            type: "input_response",
        });
        setResponseText("");
    }, [requestId, responseText, stepByStep?.handlers]);

    const onInputKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key !== "Enter") {
                return;
            }
            if (e.nativeEvent?.isComposing) {
                return;
            }
            if (!requestId) {
                return;
            }
            stepByStep?.handlers?.respond?.({
                id: nanoid(),
                timestamp: Date.now(),
                data: responseText,
                request_id: requestId,
                type: "input_response",
            });
            setResponseText("");
        },
        [requestId, responseText, stepByStep?.handlers],
    );

    const reset = useCallback(() => {
        resetActiveParticipants();
        resetActiveEventType();
    }, [resetActiveEventType, resetActiveParticipants]);

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
            if (!stepByStep?.handlers?.sendControl) {
                return;
            }
            const rid = requestId ?? "<unknown>";
            stepByStep.handlers.sendControl({
                data: controlToResponse({ kind: action }),
                request_id: rid,
            });
            if (action === "quit") {
                reset();
            }
        },
        [requestId, stepByStep?.handlers, reset],
    );
    const toggleDetailsView = useCallback(() => {
        setDetailsViewActive(prev => !prev);
    }, []);
    const doContinue = useCallback(() => {
        onControl("continue");
        setDetailsViewActive(false);
    }, [onControl]);
    const doRun = useCallback(() => {
        onControl("run");
        setDetailsViewActive(false);
    }, [onControl]);
    const doQuit = useCallback(() => {
        onControl("quit");
        setDetailsViewActive(false);
        reset();
    }, [onControl, reset]);
    const currentEvent = stepByStep?.currentEvent;
    const agents = (currentEvent?.agents as any)?.all;
    const haveAgents = Array.isArray(agents) && agents.length > 0;
    return (
        <div className="waldiez-step-by-step-view" data-testid={`step-by-step-${flowId}`}>
            <div className="modal-sticky-top">
                {/* Controls (if pending action) */}
                {stepByStep?.pendingControlInput && (
                    <div className="controls">
                        <button
                            className="btn btn-primary"
                            type="button"
                            onClick={doContinue}
                            disabled={!stepByStep?.pendingControlInput}
                        >
                            <FaStepForward /> <span>Continue</span>
                        </button>
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={doRun}
                            disabled={!stepByStep?.pendingControlInput}
                        >
                            <FaPlay /> <span>Run</span>
                        </button>
                        <button
                            className="btn btn-danger"
                            type="button"
                            onClick={doQuit}
                            disabled={!stepByStep?.pendingControlInput}
                        >
                            <FaStop /> <span>Quit</span>
                        </button>
                        {haveAgents ? (
                            detailsViewActive ? (
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={toggleDetailsView}
                                    disabled={!stepByStep?.pendingControlInput}
                                >
                                    <FaCaretLeft /> <span>Back</span>
                                </button>
                            ) : (
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={toggleDetailsView}
                                    disabled={!stepByStep?.pendingControlInput}
                                >
                                    <FaInfo /> <span>Info</span>
                                </button>
                            )
                        ) : null}
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
                                placeholder="Type your response... (Enter to send)"
                                value={responseText}
                                type={stepByStep.activeRequest.password === true ? "password" : "text"}
                                onChange={onInputChange}
                                onKeyDown={onInputKeyDown}
                                autoCapitalize="off"
                                autoCorrect="off"
                                autoComplete="off"
                            />
                            <button className="btn btn-primary" type="button" onClick={onRespond}>
                                Send
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="content overflow-y-auto modal-body-main">
                {haveAgents && detailsViewActive ? (
                    <EventAgentsList agents={agents} darkMode={isDarkMode} />
                ) : events.length > 0 ? (
                    <div className="event-history">
                        <EventConsole events={events} autoScroll />
                    </div>
                ) : (
                    <div className="event-history">
                        <EventConsole events={[{ type: "empty", content: "No messages yet..." }]} />
                    </div>
                )}
            </div>
        </div>
    );
};

StepByStepView.displayName = "WaldiezStepByStepView";
