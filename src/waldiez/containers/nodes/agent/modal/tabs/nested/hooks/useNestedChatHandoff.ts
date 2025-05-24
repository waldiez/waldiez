/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import { nanoid } from "nanoid";

import type { WaldiezAgentHandoff, WaldiezHandoffCondition, WaldiezLLMBasedCondition } from "@waldiez/types";

type UseNestedChatHandoffOptions = {
    handoffs: WaldiezAgentHandoff[];
    setHandoffs: (updater: (prev: WaldiezAgentHandoff[]) => WaldiezAgentHandoff[]) => void;
};

export const useNestedChatHandoff = ({ handoffs, setHandoffs }: UseNestedChatHandoffOptions) => {
    const handoff = useMemo(() => {
        return handoffs.find(handoff => {
            const inConditions = [
                ...(handoff.llm_transitions ?? []),
                ...(handoff.context_transitions ?? []),
            ].some(c => c.target.target_type === "NestedChatTarget");

            const inAfterWork = handoff.after_work?.target_type === "NestedChatTarget";

            return inConditions || inAfterWork;
        });
    }, [handoffs]);

    const condition = useMemo(() => {
        return (
            handoff?.llm_transitions?.[0]?.condition ?? handoff?.context_transitions?.[0]?.condition ?? null
        );
    }, [handoff]);

    const onDataChange = useCallback(
        (updated: WaldiezHandoffCondition | null) => {
            setHandoffs(prev => {
                // Case 1: Create new handoff when none exists but we have a condition
                if (!handoff && updated) {
                    return [...prev, createNewHandoff(updated)];
                }

                // Case 2: No-op when no handoff exists and no condition provided
                if (!handoff) {
                    return prev;
                }

                // Case 3 & 4: Update existing handoff
                return prev.map(h => {
                    if (h.id !== handoff.id) {
                        return h;
                    }
                    return updateHandoff(h, updated);
                });
            });
        },
        [handoff, setHandoffs],
    );

    return { condition, onDataChange };
};

const isLLM = (cond: WaldiezHandoffCondition | null): cond is WaldiezLLMBasedCondition => {
    return (
        cond !== null && (cond.condition_type === "string_llm" || cond.condition_type === "context_str_llm")
    );
};

const createNewHandoff = (condition: WaldiezHandoffCondition): WaldiezAgentHandoff => {
    const newTarget = {
        target_type: "NestedChatTarget",
        value: nanoid(),
    } as const;

    return {
        id: nanoid(),
        llm_transitions: isLLM(condition) ? [{ target: newTarget, condition }] : [],
        context_transitions: !isLLM(condition) ? [{ target: newTarget, condition }] : [],
        after_work: newTarget,
    };
};

const updateHandoff = (
    handoff: WaldiezAgentHandoff,
    updated: WaldiezHandoffCondition | null,
): WaldiezAgentHandoff => {
    // When null is passed, remove all NestedChatTarget conditions
    if (updated === null) {
        return {
            ...handoff,
            llm_transitions: filterOutNestedChatTargets(handoff.llm_transitions),
            context_transitions: filterOutNestedChatTargets(handoff.context_transitions),
        };
    }

    // Find or create a target
    const target = findOrCreateNestedChatTarget(handoff);

    // Update based on condition type
    if (isLLM(updated)) {
        return {
            ...handoff,
            llm_transitions: [
                ...filterOutNestedChatTargets(handoff.llm_transitions),
                { target, condition: updated },
            ],
            context_transitions: filterOutNestedChatTargets(handoff.context_transitions),
        };
    } else {
        return {
            ...handoff,
            llm_transitions: filterOutNestedChatTargets(handoff.llm_transitions),
            context_transitions: [
                ...filterOutNestedChatTargets(handoff.context_transitions),
                { target, condition: updated },
            ],
        };
    }
};

const filterOutNestedChatTargets = (conditions: any[] = []) => {
    return conditions.filter(c => c.target.target_type !== "NestedChatTarget") || [];
};

const findOrCreateNestedChatTarget = (handoff: WaldiezAgentHandoff) => {
    const target =
        handoff.llm_transitions?.find(c => c.target.target_type === "NestedChatTarget")?.target ??
        handoff.context_transitions?.find(c => c.target.target_type === "NestedChatTarget")?.target ??
        (handoff.after_work?.target_type === "NestedChatTarget" ? handoff.after_work : undefined);

    return (
        target ??
        handoff.after_work ??
        ({
            target_type: "NestedChatTarget",
            target: nanoid(),
        } as const)
    );
};
