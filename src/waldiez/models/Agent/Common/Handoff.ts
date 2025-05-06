/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
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

export type WaldiezStringLLMCondition = {
    condition_type: "string_llm";
    prompt: string;
    data?: Record<string, any>;
};

export type WaldiezContextStrLLMCondition = {
    condition_type: "context_str_llm";
    context_str: string;
    data?: Record<string, any>;
};

export type WaldiezLLMCondition = WaldiezStringLLMCondition | WaldiezContextStrLLMCondition;

export type WaldiezStringContextCondition = {
    condition_type: "string_context";
    variable_name: string;
};

export type WaldiezExpressionContextCondition = {
    condition_type: "expression_context";
    expression: string;
    data?: Record<string, any>;
};

export type WaldiezContextCondition = WaldiezStringContextCondition | WaldiezExpressionContextCondition;

export type WaldiezOnCondition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezLLMCondition;
};

export type WaldiezOnContextCondition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezContextCondition;
};

export type WaldiezAgentHandoff = {
    llm_conditions?: WaldiezOnCondition[];
    context_conditions?: WaldiezOnContextCondition[];
    after_work?: WaldiezTransitionTarget;
    explicit_tool_handoff_info?: Record<string, any>;
};
