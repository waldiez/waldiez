/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    ValidConditionTypes,
    ValidTransitionTargetTypes,
    WaldiezHandoffAvailability,
    WaldiezHandoffCondition,
    WaldiezTransitionTarget,
} from "@waldiez/models/common";

/**
 * getStringLLMCondition
 * Returns a WaldiezHandoffCondition object for a string LLM condition.
 * If the data object contains a valid conditionType and prompt, it returns that.
 * Otherwise, it returns a default condition with a prompt.
 * @param data - The data object containing the condition information.
 * @param defaultPrompt - The default prompt to use if no valid condition is found.
 */
const getStringLLMCondition = (
    data: { [key: string]: any },
    defaultPrompt: string = "Handoff to another agent",
) => {
    let condition: WaldiezHandoffCondition | null = {
        conditionType: "string_llm",
        prompt: defaultPrompt,
    };
    if ("conditionType" in data && data.conditionType === "string_llm") {
        if ("prompt" in data && typeof data.prompt === "string") {
            condition = {
                conditionType: "string_llm",
                prompt: data.prompt,
            };
        }
    }
    return condition;
};

/**
 * getContextStrLLMCondition
 * Returns a WaldiezHandoffCondition object for a context string LLM condition.
 * If the data object contains a valid conditionType and context_str, it returns that.
 * Otherwise, it returns a default condition with an empty context_str.
 * @param data - The data object containing the condition information.
 * @returns - A WaldiezHandoffCondition object for a context string LLM condition.
 */
const getContextStrLLMCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition = {
        conditionType: "context_str_llm",
        context_str: "",
    };
    if ("conditionType" in data && data.conditionType === "context_str_llm") {
        if ("context_str" in data && typeof data.context_str === "string") {
            condition = {
                conditionType: "context_str_llm",
                context_str: data.context_str,
            };
        }
    }
    return condition;
};

/**
 * getStringContextCondition
 * Returns a WaldiezHandoffCondition object for a string context condition.
 * If the data object contains a valid conditionType and variable_name, it returns that.
 * Otherwise, it returns a default condition with an empty variable_name.
 * @param data - The data object containing the condition information.
 * @returns - A WaldiezHandoffCondition object for a string context condition.
 */
const getStringContextCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition = {
        conditionType: "string_context",
        variable_name: "",
    };
    if ("conditionType" in data && data.conditionType === "string_context") {
        if ("variable_name" in data && typeof data.variable_name === "string") {
            condition = {
                conditionType: "string_context",
                variable_name: data.variable_name,
            };
        }
    }
    return condition;
};

/**
 * getExpressionContextCondition
 * Returns a WaldiezHandoffCondition object for an expression context condition.
 * If the data object contains a valid conditionType and expression, it returns that.
 * Otherwise, it returns a default condition with an empty expression.
 * @param data - The data object containing the condition information.
 * @returns - A WaldiezHandoffCondition object for an expression context condition.
 */
const getExpressionContextCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition = {
        conditionType: "expression_context",
        expression: "",
    };
    if ("conditionType" in data && data.conditionType === "expression_context") {
        if ("expression" in data && typeof data.expression === "string") {
            condition = {
                conditionType: "expression_context",
                expression: data.expression,
            };
        }
    }
    return condition;
};

/**
 * getHandoffAvailability
 * Returns a WaldiezHandoffAvailability object based on the provided JSON data.
 * If the JSON contains an "available" field with a valid type and value, it returns that.
 * Otherwise, it returns a default availability with type "none" and an empty value.
 * @param json - The JSON object containing handoff availability information.
 * @returns - A WaldiezHandoffAvailability object.
 */
export const getHandoffAvailability = (json: { [key: string]: any }) => {
    const availability: WaldiezHandoffAvailability = {
        type: "none",
        value: "",
    };
    if ("available" in json && json.available) {
        if (typeof json.available === "object") {
            if (
                "type" in json.available &&
                typeof json.available.type === "string" &&
                ["string", "expression", "none"].includes(json.available.type)
            ) {
                availability.type = json.available.type;
            }
            if ("value" in json.available && typeof json.available.value === "string") {
                availability.value = json.available.value;
            }
        }
    }
    return availability;
};

/**
 * getHandoffCondition
 * Returns a WaldiezHandoffCondition object based on the provided JSON data.
 * If the JSON contains a valid condition, it returns that.
 * Otherwise, it returns a default condition with a prompt.
 * @param data - The JSON object containing handoff condition information.
 * @param defaultPrompt - The default prompt to use if no valid condition is found.
 * @returns - A WaldiezHandoffCondition object.
 */
export const getHandoffCondition = (
    data: { [key: string]: any },
    defaultPrompt: string = "Handoff to another agent",
) => {
    let handoffCondition: WaldiezHandoffCondition = {
        conditionType: "string_llm",
        prompt: defaultPrompt,
    };
    if ("condition" in data && data.condition) {
        if (typeof data.condition === "object") {
            if (
                "conditionType" in data.condition &&
                data.condition.conditionType &&
                ValidConditionTypes.includes(data.condition.conditionType)
            ) {
                const conditionType = data.condition.conditionType;
                switch (conditionType) {
                    case "string_llm":
                        handoffCondition = getStringLLMCondition(data.condition, defaultPrompt);
                        break;
                    case "context_str_llm":
                        handoffCondition = getContextStrLLMCondition(data.condition);
                        break;
                    case "string_context":
                        handoffCondition = getStringContextCondition(data.condition);
                        break;
                    case "expression_context":
                        handoffCondition = getExpressionContextCondition(data.condition);
                        break;
                    default:
                        break;
                }
            }
        }
    }
    return handoffCondition;
};

/**
 * isValidTransitionTarget
 * Checks if the provided object is a valid WaldiezTransitionTarget.
 * It verifies that the object has a targetType and value, and that the targetType is one of the valid types.
 * @param obj - The object to check.
 * @returns - True if the object is a valid WaldiezTransitionTarget, false otherwise.
 */
const isValidTransitionTarget = (obj: unknown): obj is WaldiezTransitionTarget => {
    if (!obj || typeof obj !== "object") {
        return false;
    }

    const target = obj as any;
    if (!("targetType" in target) || typeof target.targetType !== "string") {
        return false;
    }

    if (!ValidTransitionTargetTypes.includes(target.targetType)) {
        return false;
    }
    return (
        "value" in target &&
        Array.isArray(target.value) &&
        target.value.every((t: unknown) => typeof t === "string")
    );
};

/**
 * getAfterWork
 * Extracts the after work transition target from the provided JSON object.
 * If not found or invalid, returns null.
 * @param data - The JSON object to extract the after work transition target from.
 * @returns - A WaldiezTransitionTarget object or null if not found.
 */
export const getAfterWork = (data: Record<string, unknown>): WaldiezTransitionTarget | null => {
    if (
        "afterWork" in data &&
        typeof data.afterWork === "object" &&
        data.afterWork &&
        isValidTransitionTarget(data.afterWork)
    ) {
        return data.afterWork as WaldiezTransitionTarget;
    }
    return null;
};
