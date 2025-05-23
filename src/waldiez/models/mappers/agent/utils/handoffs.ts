/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    ValidTransitionTargetTypes,
    WaldiezAgentHandoff,
    WaldiezHandoffCondition,
    WaldiezOnCondition,
    WaldiezOnContextCondition,
    WaldiezTransitionTarget,
} from "@waldiez/models/Agent/Common";

const isValidTransitionTarget = (obj: unknown): obj is WaldiezTransitionTarget => {
    if (!obj || typeof obj !== "object") {
        return false;
    }

    const target = obj as any;
    if (!("target_type" in target) || typeof target.target_type !== "string") {
        return false;
    }

    if (!ValidTransitionTargetTypes.includes(target.target_type)) {
        return false;
    }

    // Validate target field based on type
    switch (target.target_type) {
        case "AgentTarget":
        case "GroupChatTarget":
        case "NestedChatTarget":
            return typeof target.target === "string";
        case "RandomAgentTarget":
            return Array.isArray(target.target) && target.target.every((t: unknown) => typeof t === "string");
        case "AskUserTarget":
        case "GroupManagerTarget":
        case "RevertToUserTarget":
        case "StayTarget":
        case "TerminateTarget":
            return true; // These don't require a target field
        default:
            return false;
    }
};

const isValidCondition = (obj: unknown): obj is WaldiezHandoffCondition => {
    if (!obj || typeof obj !== "object") {
        return false;
    }

    const condition = obj as any;
    if (!("condition_type" in condition) || typeof condition.condition_type !== "string") {
        return false;
    }

    switch (condition.condition_type) {
        case "string_llm":
            return typeof condition.prompt === "string";
        case "context_str_llm":
            return typeof condition.context_str === "string";
        case "string_context":
            return typeof condition.variable_name === "string";
        case "expression_context":
            return typeof condition.expression === "string";
        default:
            return false;
    }
};

const isValidOnCondition = (obj: unknown): obj is WaldiezOnCondition => {
    if (!obj || typeof obj !== "object") {
        return false;
    }

    const onCondition = obj as any;
    return (
        "target" in onCondition &&
        "condition" in onCondition &&
        isValidTransitionTarget(onCondition.target) &&
        isValidCondition(onCondition.condition) &&
        (onCondition.condition.condition_type === "string_llm" ||
            onCondition.condition.condition_type === "context_str_llm")
    );
};

const isValidOnContextCondition = (obj: unknown): obj is WaldiezOnContextCondition => {
    if (!obj || typeof obj !== "object") {
        return false;
    }

    const onContextCondition = obj as any;
    return (
        "target" in onContextCondition &&
        "condition" in onContextCondition &&
        isValidTransitionTarget(onContextCondition.target) &&
        isValidCondition(onContextCondition.condition) &&
        (onContextCondition.condition.condition_type === "string_context" ||
            onContextCondition.condition.condition_type === "expression_context")
    );
};

// eslint-disable-next-line max-statements
const isValidHandoff = (obj: unknown): obj is WaldiezAgentHandoff => {
    if (!obj || typeof obj !== "object") {
        return false;
    }

    const handoff = obj as any;

    // Must have an id
    if (!("id" in handoff) || typeof handoff.id !== "string") {
        return false;
    }

    // Validate optional llm_conditions
    if ("llm_conditions" in handoff) {
        if (!Array.isArray(handoff.llm_conditions)) {
            return false;
        }
        if (!handoff.llm_conditions.every(isValidOnCondition)) {
            return false;
        }
    }

    // Validate optional context_conditions
    if ("context_conditions" in handoff) {
        if (!Array.isArray(handoff.context_conditions)) {
            return false;
        }
        if (!handoff.context_conditions.every(isValidOnContextCondition)) {
            return false;
        }
    }

    // Validate optional after_work
    if ("after_work" in handoff && handoff.after_work !== undefined) {
        if (!isValidTransitionTarget(handoff.after_work)) {
            return false;
        }
    }

    return true;
};

export const getHandoffs = (data: Record<string, unknown>): WaldiezAgentHandoff[] => {
    if ("handoffs" in data && Array.isArray(data.handoffs)) {
        return data.handoffs.filter(isValidHandoff);
    }
    return [];
};
