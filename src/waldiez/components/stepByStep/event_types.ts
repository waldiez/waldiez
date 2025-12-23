/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

export type ToolCall = {
    function: { name: string; arguments?: string };
};

export type EventBase<TType extends string, TContent> = {
    id?: string;
    type: TType;
    content: TContent;
    sender?: string;
    recipient?: string;
    // Optional common fields you may have:
    timestamp?: string;
};

export type TextContent = { sender: string; recipient: string; content: any };
export type PostCarryoverContent = { sender: string; recipient: string; message: string };
export type GroupChatRunChatContent = { speaker: string };
export type UsingAutoReplyContent = { sender: string; recipient: string };
export type ToolCallContent = { sender: string; recipient: string; tool_calls: ToolCall[] };
export type ExecuteFunctionContent = { func_name: string; recipient: string; arguments?: unknown };
export type ExecutedFunctionContent = {
    func_name?: string;
    is_exec_success?: boolean;
    recipient?: string;
    content?: any;
};
export type InputRequestContent = {
    prompt?: string;
    /** Your backend should use this to route the response back to the pending request */
    request_id?: string;
    /** Provide a responder for local mock, else use onRespond prop */
    respond?: (text: string) => void;
};
export type ToolResponseContent = { content: string; sender: string; recipient: string };
export type TerminationContent = { termination_reason?: string };
export type GroupChatResumeContent = Record<string, never>;
export type InfoContent = string | Record<string, never>;
export type ErrorContent = string | Record<string, never>;
export type RunCompletionContent = Record<string, never>;
export type GenerateCodeExecutionReplyContent = Record<string, never>;
export type TerminationAndHumanReplyNoInputContent = {
    no_human_input_msg: string;
    sender: string;
    recipient: string;
};
export type OnContextConditionTransitionContent = {
    source_agent: string;
    transition_target: string;
};
export type AfterWorksTransitionContent = {
    source_agent: string;
    transition_target: string;
};
export type OnConditionLLMTransitionContent = {
    source_agent: string;
    transition_target: string;
};
export type ReplyResultTransitionContent = {
    source_agent: string;
    transition_target: string;
};

export type TransitionEvent =
    | EventBase<"on_context_condition_transition", OnContextConditionTransitionContent>
    | EventBase<"after_works_transition", AfterWorksTransitionContent>
    | EventBase<"on_condition_llm_transition", OnConditionLLMTransitionContent>
    | EventBase<"on_condition_l_l_m_transition", OnConditionLLMTransitionContent>
    | EventBase<"reply_result_transition", ReplyResultTransitionContent>;

export type WaldiezEvent =
    | EventBase<"text", TextContent>
    | EventBase<"post_carryover_processing", PostCarryoverContent>
    | EventBase<"group_chat_run_chat", GroupChatRunChatContent>
    | EventBase<"using_auto_reply", UsingAutoReplyContent>
    | EventBase<"tool_call", ToolCallContent>
    | EventBase<"execute_function", ExecuteFunctionContent>
    | EventBase<"executed_function", ExecutedFunctionContent>
    | EventBase<"input_request", InputRequestContent>
    | EventBase<"tool_response", ToolResponseContent>
    | EventBase<"termination", TerminationContent>
    | EventBase<"run_completion", RunCompletionContent>
    | EventBase<"generate_code_execution_reply", GenerateCodeExecutionReplyContent>
    | EventBase<"group_chat_resume", GroupChatResumeContent>
    | EventBase<"info", InfoContent>
    | EventBase<"error", ErrorContent>
    | EventBase<"empty", TextContent>
    | EventBase<"termination_and_human_reply_no_input", TerminationAndHumanReplyNoInputContent>
    | TransitionEvent
    | EventBase<string, any>; // fallback/unknown
