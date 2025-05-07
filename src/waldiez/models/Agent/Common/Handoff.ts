/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

/**
 * Waldiez Handoff transition target
 * The target of a handoff transition.
 * It can be one of the following:
 * - `AgentTarget`: A specific agent target.
 * - `RandomAgentTarget`: A random agent target.
 * - `GroupChatTarget`: A group chat target.
 * - `NestedChatTarget`: A nested chat target.
 * - `AskUserTarget`: Ask the user for input.
 * - `GroupManagerTarget`: A group manager target.
 * - `RevertToUserTarget`: Revert to the user.
 * - `StayTarget`: Stay in the current state.
 * - `TerminateTarget`: Terminate the conversation.
 * @param target_type - Type of the target
 * @param target - Target string
 * @param order - Order of the target
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentNestedChat}
 */
export type WaldiezTransitionTarget =
    | { target_type: "AgentTarget"; target: string; order?: number }
    | { target_type: "RandomAgentTarget"; target: string[]; order?: number }
    | { target_type: "GroupChatTarget" | "NestedChatTarget"; target: string; order?: number }
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
 * @see {@link WaldiezLLMCondition}
 * @see {@link WaldiezOnCondition}
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
* @see {@link WaldiezLLMCondition}
* @see {@link WaldiezOnCondition}
*/
export type WaldiezContextStrLLMCondition = {
    condition_type: "context_str_llm";
    context_str: string;
    data?: Record<string, any>;
};

/**
 * Waldiez LLM condition
 * A condition that can be evaluated by an LLM.
 * @param llm_conditions - LLM conditions
 * @param context_conditions - Context conditions
 * @see {@link WaldiezStringLLMCondition}
 * @see {@link WaldiezContextStrLLMCondition}
 * @see {@link WaldiezOnCondition}
 */
export type WaldiezLLMCondition = WaldiezStringLLMCondition | WaldiezContextStrLLMCondition;

/**
 * Waldiez String context condition
 *  This condition checks if a named context variable exists and is truthy.
 * @param condition_type - Type of the condition
 * @param variable_name - Name of the context variable
 * @see {@link WaldiezContextCondition}
 * @see {@link WaldiezOnContextCondition}
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
 * @see {@link WaldiezContextCondition}
 * @see {@link WaldiezOnContextCondition}
 */
export type WaldiezExpressionContextCondition = {
    condition_type: "expression_context";
    expression: string;
    data?: Record<string, any>;
};

/**
 * Waldiez context condition
 * A condition that can be evaluated against context variables.
 * @param string_context - String context condition
 * @param expression_context - Expression context condition
 * @see {@link WaldiezStringContextCondition}
 * @see {@link WaldiezExpressionContextCondition}
 * @see {@link WaldiezOnContextCondition}
 */
export type WaldiezContextCondition = WaldiezStringContextCondition | WaldiezExpressionContextCondition;

/**
 * Waldiez on condition
 * A condition that triggers a handoff to a target based on LLM evaluation.
 * @param target - Target of the handoff
 * @param condition - Condition to be evaluated
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezLLMCondition}
 * @see {@link WaldiezOnContextCondition}
 * @see {@link WaldiezContextCondition}
 */
export type WaldiezOnCondition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezLLMCondition;
};

/**
 * Waldiez on context condition
 * A condition that triggers a handoff to a target based on context evaluation.
 * @param target - Target of the handoff
 * @param condition - Condition to be evaluated
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezContextCondition}
 */
export type WaldiezOnContextCondition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezContextCondition;
};

/**
 * Waldiez agent handoff
 * A handoff that can be triggered by LLM or context conditions.
 * @param llm_conditions - LLM conditions
 * @param context_conditions - Context conditions
 * @param after_work - After work target
 * @param explicit_tool_handoff_info - Explicit tool handoff information
 * @see {@link WaldiezLLMCondition}
 * @see {@link WaldiezContextCondition}
 * @see {@link WaldiezOnCondition}
 */
export type WaldiezAgentHandoff = {
    llm_conditions?: WaldiezOnCondition[];
    context_conditions?: WaldiezOnContextCondition[];
    after_work?: WaldiezTransitionTarget;
    explicit_tool_handoff_info?: Record<string, any>;
};

/**
 * Waldiez agent handoff target types
 * The types of targets that can be used in a handoff.
 * These can be used in either an `OnCondition` transition or an `AfterWork` transition.
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
