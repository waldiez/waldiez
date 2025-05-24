/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Waldiez Condition Category.
 * @param llm - LLM condition
 * @param context - Context condition
 */
export type ConditionCategory = "llm" | "context";

/**
 * Waldiez Condition Type.
 * @param string_llm - String LLM condition
 * @param context_str_llm - Context string LLM condition
 * @param string_context - String context condition
 * @param expression_context - Expression context condition
 */
export type ConditionType = "string_llm" | "context_str_llm" | "string_context" | "expression_context";

/**
 * The type of target in a handoff transition.
 * @param AgentTarget - A specific agent target.
 * @param RandomAgentTarget - A random agent target.
 * @param GroupChatTarget - A group chat target.
 * @param NestedChatTarget - A nested chat target.
 * @param AskUserTarget - Ask the user for input.
 * @param GroupManagerTarget - A group manager target.
 * @param RevertToUserTarget - Revert to the user.
 * @param StayTarget - Stay in the current state.
 * @param TerminateTarget - Terminate the conversation.
 * @param target_type - Type of the target
 * @param target - Target string
 * @param order - Order of the target
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentNestedChat}
 */
export type WaldiezTransitionTarget =
    | { target_type: "AgentTarget"; value: string; order?: number }
    | { target_type: "RandomAgentTarget"; value: string[]; order?: number }
    | { target_type: "GroupChatTarget" | "NestedChatTarget"; value: string; order?: number }
    | {
          target_type:
              | "AskUserTarget"
              | "GroupManagerTarget"
              | "RevertToUserTarget"
              | "StayTarget"
              | "TerminateTarget";
          order?: number;
      };

/**
 * Waldiez String LLM condition
 * A static string prompt to be evaluated by an LLM.
 * @param condition_type - Type of the condition
 * @param prompt - Prompt string
 * @param data - Additional data
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezLLMBasedCondition}
 */
export type WaldiezStringLLMCondition = {
    condition_type: "string_llm";
    prompt: string;
    data?: Record<string, any>;
};

/**
 * Waldiez ContextStr LLM condition
 * A `ContextStr` object with context variable placeholders that
    will be substituted before being evaluated by an LLM.
* @param condition_type - Type of the condition
* @param context_str - The context string
* @param data - Additional data
* @see {@link WaldiezLLMBasedCondition}
* @see {@link WaldiezLLMBasedCondition}
*/
export type WaldiezContextStrLLMCondition = {
    condition_type: "context_str_llm";
    context_str: string;
    data?: Record<string, any>;
};

/**
 * Waldiez LLM condition
 * A condition that can be evaluated by an LLM.
 * @param condition_type - Type of the condition (in any of the cases)
 * @param prompt - Prompt string (in case of string LLM condition)
 * @param context_str - The context string (in case of context string LLM condition)
 * @param data - Additional data (in any of the cases)
 * @see {@link WaldiezStringLLMCondition}
 * @see {@link WaldiezContextStrLLMCondition}
 */
export type WaldiezLLMBasedCondition = WaldiezStringLLMCondition | WaldiezContextStrLLMCondition;

/**
 * Waldiez String context condition
 *  This condition checks if a named context variable exists and is truthy.
 * @param condition_type - Type of the condition
 * @param variable_name - Name of the context variable
 * @see {@link WaldiezContextBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export type WaldiezStringContextCondition = {
    condition_type: "string_context";
    variable_name: string;
};

/**
 * Waldiez Expression context condition
 *  This condition evaluates a ContextExpression against the context variables.
 * @param condition_type - Type of the condition
 * @param expression - Expression to be evaluated
 * @param data - Additional data
 * @see {@link WaldiezContextBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export type WaldiezExpressionContextCondition = {
    condition_type: "expression_context";
    expression: string;
    data?: Record<string, any>;
};

/**
 * Waldiez context condition
 * A condition that can be evaluated against context variables.
 * @param condition_type - Type of the condition (in any of the cases)
 * @param variable_name - Name of the context variable (in case of string context condition)
 * @param expression - Expression to be evaluated (in case of expression context condition)
 * @param data - Additional data (in case of string context condition)
 * @see {@link WaldiezStringContextCondition}
 * @see {@link WaldiezExpressionContextCondition}
 */
export type WaldiezContextBasedCondition = WaldiezStringContextCondition | WaldiezExpressionContextCondition;

/**
 * Waldiez Handoff condition
 * A condition that can be evaluated by an LLM or against context variables.
 * @param condition - LLM or context condition to be evaluated
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export type WaldiezHandoffCondition = WaldiezLLMBasedCondition | WaldiezContextBasedCondition;

/**
 * Condition wrapper for LLM conditions.
 * Matches the Python WaldiezLLMBasedCondition class.
 * @param target - Target of the handoff
 * @param condition - LLM condition to be evaluated
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezLLMBasedCondition}
 */
export type WaldiezLLMBasedTransition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezLLMBasedCondition;
};

/**
 * Condition wrapper for context conditions.
 * Matches the Python WaldiezContextBasedCondition class.
 * @param target - Target of the handoff
 * @param condition - Context condition to be evaluated
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezContextBasedCondition}
 */
export type WaldiezContextBasedTransition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezContextBasedCondition;
};

/**
 * Waldiez handoff condition
 * A condition that can be evaluated by an LLM or against context variables.
 * This matches the Python WaldiezHandoffCondition union type.
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export type WaldiezHandoffTransition = WaldiezLLMBasedTransition | WaldiezContextBasedTransition;

/**
 * Waldiez agent handoff
 * A handoff that can be triggered by LLM or context conditions.
 * @param id - Unique identifier for the handoff
 * @param llm_transitions - LLM conditions
 * @param context_transitions - Context conditions
 * @param after_work - After work target
 * @param data - Additional data
 * @see {@link WaldiezLLMBasedTransition}
 * @see {@link WaldiezContextBasedTransition}
 */
export type WaldiezAgentHandoff = {
    id: string;
    llm_transitions?: WaldiezLLMBasedTransition[];
    context_transitions?: WaldiezContextBasedTransition[];
    after_work?: WaldiezTransitionTarget;
    [key: string]: unknown;
};

/**
 * The types of targets that can be used in a handoff.
 * These can be used in either an `OnCondition` transition or an `AfterWork` transition.
 * Possible values are:
 * - `AgentTarget`: A specific agent target.
 * - `RandomAgentTarget`: A random agent target.
 * - `GroupChatTarget`: A group chat target.
 * - `NestedChatTarget`: A nested chat target.
 * - `AskUserTarget`: Ask the user for input.
 * - `GroupManagerTarget`: A group manager target.
 * - `RevertToUserTarget`: Revert to the user.
 * - `StayTarget`: Stay in the current state.
 * - `TerminateTarget`: Terminate the conversation.
 * @param AgentTarget - A specific agent target.
 * @param RandomAgentTarget - A random agent target.
 * @param GroupChatTarget - A group chat target.
 * @param NestedChatTarget - A nested chat target.
 * @param AskUserTarget - Ask the user for input.
 * @param GroupManagerTarget - A group manager target.
 * @param RevertToUserTarget - Revert to the user.
 * @param StayTarget - Stay in the current state.
 * @param TerminateTarget - Terminate the conversation.
 * @see {@link WaldiezTransitionTarget}
 */
export type TransitionTargetType =
    | "AgentTarget"
    | "RandomAgentTarget"
    | "GroupChatTarget"
    | "NestedChatTarget"
    | "AskUserTarget"
    | "GroupManagerTarget"
    | "RevertToUserTarget"
    | "StayTarget"
    | "TerminateTarget";

/**
 * Possible Transition target types
 * These are the possible values for the `target_type` field in a handoff transition.
 */
export const ValidTransitionTargetTypes: TransitionTargetType[] = [
    "AgentTarget",
    "RandomAgentTarget",
    "GroupChatTarget",
    "NestedChatTarget",
    "AskUserTarget",
    "GroupManagerTarget",
    "RevertToUserTarget",
    "StayTarget",
    "TerminateTarget",
];

/**
 * Possible Condition categories.
 * Split the condition types into 2 main categories:
 * - `llm`: LLM conditions (e.g. string_llm, context_str_llm)
 * - `context`: Context conditions (e.g. string_context, expression_context)
 */
export const ValidConditionCategories: ConditionCategory[] = ["llm", "context"];

/**
 * Possible Condition types
 * These are the possible values for the `condition_type` field in a handoff condition.
 */
export const ValidConditionTypes: ConditionType[] = [
    "string_llm",
    "context_str_llm",
    "string_context",
    "expression_context",
];
