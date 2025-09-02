/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useRef } from "react";

import type { WaldiezStepByStep } from "@waldiez/components/stepByStep/types";
import { useWaldiez } from "@waldiez/store";
import { WaldiezStepByStepUtils } from "@waldiez/utils";

/**
 * Hook to manage agent class updates based on step-by-step state
 */
export const useAgentClassUpdates = (stepByStep?: WaldiezStepByStep | null) => {
    const setActive = useWaldiez(s => s.setActiveParticipants);
    const resetActive = useWaldiez(s => s.resetActiveParticipants);
    const getGroupManager = useWaldiez(s => s.getGroupManager);

    const lastIndexRef = useRef(-1);

    // eslint-disable-next-line max-statements
    useEffect(() => {
        if (!stepByStep?.active) {
            resetActive();
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

        const { sender, recipient } = WaldiezStepByStepUtils.extractEventParticipants(latest);
        // sender and recipient are the agent names,
        // let's get the ids from stepByStep.participants
        let senderId = stepByStep.participants.find(p => p.name === sender)?.id ?? null;
        const recipientId = stepByStep.participants.find(p => p.name === recipient)?.id ?? null;
        if (sender === "_Group_Tool_Executor") {
            const groupManager = getGroupManager();
            if (groupManager) {
                senderId = groupManager.id;
            }
        }
        if (senderId === null && recipientId === null) {
            return;
        }
        setActive(senderId ?? null, recipientId ?? null);
    }, [
        stepByStep?.active,
        stepByStep?.eventHistory,
        stepByStep?.participants,
        setActive,
        resetActive,
        getGroupManager,
    ]);
};
