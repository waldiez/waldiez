/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezSwarmAfterWork,
    WaldiezSwarmHandoff,
    WaldiezSwarmOnCondition,
    WaldiezSwarmUpdateSystemMessage,
} from "@waldiez/models/Agent/Swarm";

export const getSwarmFunctions = (jsonData: any): string[] => {
    const functions: string[] = [];
    if (jsonData && jsonData.functions && Array.isArray(jsonData.functions)) {
        jsonData.functions.forEach((func: any) => {
            if (typeof func === "string") {
                functions.push(func);
            }
        });
    }
    return functions;
};

export const getSwarmUpdateAgentStateBeforeReply = (jsonData: any): WaldiezSwarmUpdateSystemMessage[] => {
    const updateAgentStateBeforeReply: WaldiezSwarmUpdateSystemMessage[] = [];
    if (
        jsonData &&
        jsonData.updateAgentStateBeforeReply &&
        Array.isArray(jsonData.updateAgentStateBeforeReply)
    ) {
        jsonData.updateAgentStateBeforeReply.forEach((message: any) => {
            if (typeof message === "object") {
                if (
                    "updateFunctionType" in message &&
                    "updateFunction" in message &&
                    typeof message.updateFunctionType === "string" &&
                    ["string", "callable"].includes(message.updateFunctionType) &&
                    typeof message.updateFunction === "string"
                ) {
                    updateAgentStateBeforeReply.push({
                        updateFunctionType: message.updateFunctionType,
                        updateFunction: message.updateFunction,
                    });
                }
            }
        });
    }
    return updateAgentStateBeforeReply;
};

export const getIsInitial = (jsonData: any): boolean => {
    if (typeof jsonData === "object" && "isInitial" in jsonData) {
        return typeof jsonData.isInitial === "boolean" ? jsonData.isInitial : false;
    }
    return false;
};

export const getSwarmHandoffs = (jsonData: any): any[] => {
    const afterWorkHandoffs: WaldiezSwarmAfterWork[] = [];
    const onConditionHandoffs: WaldiezSwarmOnCondition[] = [];
    if (jsonData && jsonData.handoffs && Array.isArray(jsonData.handoffs)) {
        jsonData.handoffs.forEach((handoff: any) => {
            if (typeof handoff === "object") {
                if (
                    "recipientType" in handoff &&
                    "recipient" in handoff &&
                    typeof handoff.recipientType === "string" &&
                    typeof handoff.recipient === "string" &&
                    ["agent", "option", "callable"].includes(handoff.recipientType)
                ) {
                    // afterWork?
                    const afterWork = getSwarmAfterWorkHandoff(handoff);
                    if (afterWork) {
                        afterWorkHandoffs.push(afterWork);
                    }
                } else if (
                    "target" in handoff &&
                    "targetType" in handoff &&
                    "condition" in handoff &&
                    "available" in handoff
                ) {
                    // onCondition ?
                    const onCondition = getSwarmOnConditionHandoff(handoff);
                    if (onCondition) {
                        onConditionHandoffs.push(onCondition);
                    }
                }
            }
        });
    }
    const sortedOnConditions = onConditionHandoffs.sort((a, b) => a.target.order - b.target.order);
    const handoffs: WaldiezSwarmHandoff[] = [...afterWorkHandoffs, ...sortedOnConditions];
    return handoffs;
};

const getSwarmAfterWorkHandoff = (handoff: any): WaldiezSwarmAfterWork | null => {
    if (handoff.recipientType === "option") {
        if (["TERMINATE", "REVERT_TO_USER", "STAY", "SWARM_MANAGER"].includes(handoff.recipient)) {
            return handoff as WaldiezSwarmAfterWork;
        }
    }
    if (handoff.recipientType === "callable" || handoff.recipientType === "agent") {
        if (typeof handoff.recipient === "string") {
            return handoff as WaldiezSwarmAfterWork;
        }
    }
    return null;
};

const getSwarmOnConditionHandoff = (handoff: any): any => {
    const targetType = handoff.targetType;
    if (["agent", "nested_chat"].includes(targetType)) {
        // the target must be {id: string, order: number}
        // the agent handoffs are determined by the edges in the graph
        if (
            targetType === "nested_chat" &&
            typeof handoff.target === "object" &&
            handoff.target &&
            "id" in handoff.target &&
            "order" in handoff.target &&
            typeof handoff.target.id === "string" &&
            typeof handoff.target.order === "number"
        ) {
            if (
                typeof handoff.condition === "string" &&
                typeof handoff.available === "object" &&
                handoff.available &&
                "type" in handoff.available &&
                "value" in handoff.available &&
                ["string", "callable", "none"].includes(handoff.available.type)
            ) {
                return handoff;
            }
        }
    }
    return null;
};
