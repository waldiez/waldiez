/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type FC, useCallback, useMemo, useState } from "react";
import { FaBug } from "react-icons/fa6";
import { MdTimeline } from "react-icons/md";

import { Modal } from "@waldiez/components/modal";
import { StepByStepView } from "@waldiez/components/stepByStep";
import { type WaldiezStepByStep } from "@waldiez/components/stepByStep/types";
import { TimelineModal } from "@waldiez/components/timeline";
import { useWaldiez } from "@waldiez/store";

export const StepRunModal: FC<{
    flowId: string;
    isDarkMode: boolean;
    stepByStep?: WaldiezStepByStep | null;
    className?: string;
}> = ({ flowId, stepByStep, isDarkMode, className }) => {
    const modalTestId = `rf-${flowId}-step-run-modal`;
    const resetActiveParticipants = useWaldiez(s => s.resetActiveParticipants);
    const resetActiveEventType = useWaldiez(s => s.resetActiveEventType);
    const [timelineModalOpen, setTimelineModalOpen] = useState(false);
    const openTimelineModal = useCallback(() => {
        setTimelineModalOpen(true);
    }, []);
    const closeTimelineModal = useCallback(() => {
        setTimelineModalOpen(false);
    }, []);
    const onClose = useCallback(() => {
        if (stepByStep?.handlers?.close) {
            stepByStep.handlers?.close();
        }
        resetActiveEventType();
        resetActiveParticipants();
    }, [stepByStep?.handlers, resetActiveEventType, resetActiveParticipants]);
    const events = useMemo(() => {
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
    const canClose =
        !stepByStep?.active && !!stepByStep?.handlers?.close && (stepByStep?.eventHistory?.length ?? 0) > 0;

    const badgeText = useMemo(() => {
        if (!stepByStep) {
            return null;
        }
        const curType = stepByStep.currentEvent?.type;
        if (typeof curType === "string" && !["debug", "print", "raw"].includes(curType)) {
            return curType;
        }

        const last = events[events.length - 1] as any;
        const lastType = last?.event?.type ?? last?.type;
        if (typeof lastType === "string" && !["debug", "print", "raw"].includes(lastType)) {
            return lastType;
        }

        if (!stepByStep.active && canClose) {
            return stepByStep.eventHistory?.length > 0 ? "Finished" : null;
        }
        return "Running";
    }, [stepByStep, events, canClose]);
    if (!stepByStep?.active && !canClose) {
        return null;
    }
    const headerLeft = (
        <div className="header">
            {stepByStep.timeline ? (
                <div
                    role="button"
                    className="clickable"
                    onClick={openTimelineModal}
                    title="View Timeline"
                    data-testid={`rf-${flowId}-chat-modal-timeline`}
                >
                    <MdTimeline size={18} className="timeline-button" />
                </div>
            ) : (
                <FaBug className="icon-bug" color="#ea580c" size={18} />
            )}
        </div>
    );
    if (stepByStep.timeline && timelineModalOpen) {
        return (
            <TimelineModal
                flowId={flowId}
                isOpen={timelineModalOpen}
                onClose={closeTimelineModal}
                data={stepByStep.timeline}
            />
        );
    }
    return (
        <Modal
            flowId={flowId}
            id={modalTestId}
            title={"Step-by-step Run"}
            isOpen
            onClose={onClose}
            onCancel={onClose}
            beforeTitle={headerLeft}
            className="step-run-modal"
            hasMaximizeBtn={true}
            hasCloseBtn={true}
            dataTestId={modalTestId}
            hasUnsavedChanges={false}
            preventCloseIfUnsavedChanges={false}
        >
            <div className="modal-body min-h-[320px]">
                <StepByStepView
                    flowId={flowId}
                    isDarkMode={isDarkMode}
                    stepByStep={stepByStep}
                    events={events}
                    className={className}
                />
            </div>
            <div className="modal-sticky-bottom text-sm text-center">{badgeText}</div>
        </Modal>
    );
};
