/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import { type ChangeEvent, type FC, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { FaStepForward } from "react-icons/fa";
import { FaBug, FaCaretLeft, FaInfo, FaPlay, FaStop, FaX } from "react-icons/fa6";
import { MdTimeline } from "react-icons/md";

import { nanoid } from "nanoid";

import { FloatingPanel } from "@waldiez/components/floatingPanel";
import { AgentEventInfo } from "@waldiez/components/stepByStep/agentInfo";
import { EventConsole } from "@waldiez/components/stepByStep/console";
import { useAgentClassUpdates } from "@waldiez/components/stepByStep/hooks";
import { type WaldiezStepByStep, controlToResponse } from "@waldiez/components/stepByStep/types";
import { TimelineModal } from "@waldiez/components/timeline/timelineModal";

/**
 * Main step-by-step debug view component
 */
export const StepByStepView: FC<{
    flowId: string;
    isDarkMode: boolean;
    stepByStep?: WaldiezStepByStep | null;
    className?: string;
}> = ({ flowId, stepByStep, isDarkMode }) => {
    useAgentClassUpdates(stepByStep);
    const [responseText, setResponseText] = useState("");
    const [timelineModalOpen, setTimelineModalOpen] = useState(false);
    const [detailsViewActive, setDetailsViewActive] = useState(false);

    const openTimelineModal = useCallback(() => {
        setTimelineModalOpen(true);
    }, []);
    const closeTimelineModal = useCallback(() => {
        setTimelineModalOpen(false);
    }, []);

    const requestId = stepByStep?.activeRequest?.request_id ?? null;
    const canClose =
        !stepByStep?.active && !!stepByStep?.handlers?.close && (stepByStep?.eventHistory?.length ?? 0) > 0;

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
        },
        [requestId, stepByStep?.handlers],
    );

    const reducedHistory = useMemo(() => {
        const raw = stepByStep?.eventHistory ?? [];
        const max = 500;
        const start = Math.max(0, raw.length - max);
        return raw
            .slice(start)
            .filter(e => e && !["debug", "print", "raw", "timeline"].includes(String((e as any)?.type)))
            .map(e => {
                const x: any = e;
                const data = x.event ?? x.data ?? x.message ?? x;
                return Array.isArray(data) && data.length === 1 ? data[0] : data;
            })
            .reverse();
    }, [stepByStep?.eventHistory]);

    const badgeText = useMemo(() => {
        if (!stepByStep) {
            return null;
        }
        const curType = stepByStep.currentEvent?.type;
        if (typeof curType === "string" && !["debug", "print", "raw"].includes(curType)) {
            return curType;
        }

        const last = reducedHistory[reducedHistory.length - 1] as any;
        const lastType = last?.event?.type ?? last?.type;
        if (typeof lastType === "string" && !["debug", "print", "raw"].includes(lastType)) {
            return lastType;
        }

        if (!stepByStep.active && canClose) {
            return stepByStep.eventHistory?.length > 0 ? "Finished" : null;
        }
        return "Running";
    }, [stepByStep, reducedHistory, canClose]);

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
    }, [onControl]);
    if (!stepByStep?.active && !canClose) {
        return null;
    }
    // if the state is "error", enable close (if there is such handler)
    const mayClose = canClose || (!!stepByStep?.handlers?.close && badgeText?.toLowerCase() === "error");
    const currentEvent = stepByStep?.currentEvent;
    const eventAgents = currentEvent?.agents;
    const currentSender = (eventAgents as any)?.sender;
    const currentRecipient = (eventAgents as any)?.recipient;
    const haveAgent = Boolean(currentSender || currentRecipient);
    const headerLeft = (
        <div className="header">
            <FaBug className="icon-bug" size={18} />
            {stepByStep.timeline && (
                <div
                    role="button"
                    className="clickable"
                    onClick={openTimelineModal}
                    title="View Timeline"
                    data-testid={`rf-${flowId}-chat-modal-timeline`}
                >
                    <MdTimeline size={18} className="timeline-button" />
                </div>
            )}
            <div className="title">Step-by-step Run</div>
            {badgeText && <div className={`badge ${badgeText}`}>{badgeText}</div>}
            {!badgeText && !stepByStep?.active && <div className="badge">Finished</div>}
            {!badgeText && stepByStep?.active && <div className="badge">Running</div>}
        </div>
    );
    const headerRight = mayClose ? (
        <button
            title="Close"
            type="button"
            onClick={stepByStep?.handlers?.close}
            className="header-toggle"
            aria-label="Close panel"
        >
            <FaX size={14} />
        </button>
    ) : undefined;
    return (
        <div className="waldiez-step-by-step-view" data-testid={`step-by-step-${flowId}`}>
            <FloatingPanel
                flowId={flowId}
                title={""}
                headerLeft={headerLeft}
                headerRight={headerRight}
                maxHeight={"80vh"}
                minHeight={320}
                minWidth={420}
                maxWidth={"80vw"}
            >
                <div className="content">
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
                            {currentSender ? (
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
                    {haveAgent && detailsViewActive ? (
                        <div className="event-sender-details">
                            {currentSender && (
                                <AgentEventInfo agentData={currentSender} darkMode={isDarkMode} />
                            )}
                            {currentRecipient && (
                                <AgentEventInfo agentData={currentRecipient} darkMode={isDarkMode} />
                            )}
                        </div>
                    ) : reducedHistory.length > 0 ? (
                        <div className="event-history">
                            <EventConsole events={reducedHistory} autoScroll />
                        </div>
                    ) : (
                        <div className="event-history">
                            <EventConsole events={[{ type: "empty", content: "No messages yet..." }]} />
                        </div>
                    )}
                </div>
            </FloatingPanel>
            {stepByStep.timeline && timelineModalOpen && (
                <TimelineModal
                    flowId={flowId}
                    isOpen={timelineModalOpen}
                    onClose={closeTimelineModal}
                    data={stepByStep.timeline}
                />
            )}
        </div>
    );
};

StepByStepView.displayName = "WaldiezStepByStepView";
