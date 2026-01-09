/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useCallback, useEffect, useRef } from "react";

import type { WaldiezChatParticipant } from "@waldiez/components/chatUI/types";
import type { WaldiezStepByStep } from "@waldiez/components/stepByStep/types";
import { useWaldiez } from "@waldiez/store";
import { eventToActivity } from "@waldiez/utils/activity";
import { WaldiezStepByStepUtils } from "@waldiez/utils/stepByStep/stepByStepUtils";

/**
 * Hook to manage agent class updates based on step-by-step state
 */
export const useAgentClassUpdates = (stepByStep?: WaldiezStepByStep | null) => {
    const setActive = useWaldiez(s => s.setActiveParticipants);
    const resetActive = useWaldiez(s => s.resetActiveParticipants);
    const setActiveEventType = useWaldiez(s => s.setActiveEventType);
    const resetActiveEventType = useWaldiez(s => s.resetActiveEventType);
    const getGroupManager = useWaldiez(s => s.getGroupManager);

    const lastIndexRef = useRef(-1);

    const getParticipantIds = useCallback(
        (participants: WaldiezChatParticipant[], latestEvent: Record<string, unknown>) => {
            const { sender, recipient } = WaldiezStepByStepUtils.extractEventParticipants(latestEvent);
            // sender and recipient are the agent names,
            // let's get the ids from stepByStep.participants
            let senderId = participants.find(p => p.name === sender)?.id ?? null;
            let recipientId = participants.find(p => p.name === recipient)?.id ?? null;
            if (sender === "_Group_Tool_Executor" || recipient === "_Group_Tool_Executor") {
                const groupManager = getGroupManager();
                if (groupManager) {
                    if (sender === "_Group_Tool_Executor") {
                        senderId = groupManager.id;
                    } else {
                        recipientId = groupManager.id;
                    }
                }
            }
            return { senderId, recipientId };
        },
        [getGroupManager],
    );

    // eslint-disable-next-line max-statements
    useEffect(() => {
        if (!stepByStep?.active) {
            resetActive();
            resetActiveEventType();
            lastIndexRef.current = -1;
            return;
        }

        const events = stepByStep.eventHistory ?? [];
        if (events.length === 0 || !stepByStep.participants) {
            return;
        }
        const idx = events.length - 1;
        if (idx === lastIndexRef.current) {
            return;
        }

        const latest = events[0]; // coming in reverse order
        if (!latest || typeof latest !== "object") {
            return;
        }
        lastIndexRef.current = idx;
        const { senderId, recipientId } = getParticipantIds(stepByStep.participants, latest);
        if (senderId === null && recipientId === null) {
            return;
        }
        const activity = eventToActivity(latest);
        if (activity) {
            setActiveEventType(activity);
        }
        setActive(senderId ?? null, recipientId ?? null);
    }, [
        stepByStep?.active,
        stepByStep?.eventHistory,
        stepByStep?.participants,
        setActive,
        resetActive,
        setActiveEventType,
        resetActiveEventType,
        getGroupManager,
        getParticipantIds,
    ]);
};
