/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines */
import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getContentString } from "@waldiez/components/stepByStep/utils";
import { WaldiezChatMessageUtils } from "@waldiez/utils/chat/utils";

import { Markdown } from "../markdown";

type ToolCall = {
    function: { name: string; arguments?: string };
};

type EventBase<TType extends string, TContent> = {
    id?: string;
    type: TType;
    content: TContent;
    sender?: string;
    recipient?: string;
    // Optional common fields you may have:
    timestamp?: string;
};

type TextContent = { sender: string; recipient: string; content: any };
type PostCarryoverContent = { sender: string; recipient: string; message: string };
type GroupChatRunChatContent = { speaker: string };
type UsingAutoReplyContent = { sender: string; recipient: string };
type ToolCallContent = { sender: string; recipient: string; tool_calls: ToolCall[] };
type ExecuteFunctionContent = { func_name: string; recipient: string; arguments?: unknown };
type ExecutedFunctionContent = {
    func_name?: string;
    is_exec_success?: boolean;
    recipient?: string;
    content?: any;
};
type InputRequestContent = {
    prompt?: string;
    /** Your backend should use this to route the response back to the pending request */
    request_id?: string;
    /** Provide a responder for local mock, else use onRespond prop */
    respond?: (text: string) => void;
};
type ToolResponseContent = { content: string; sender: string; recipient: string };
type TerminationContent = { termination_reason?: string };
type GroupChatResumeContent = Record<string, never>;
type InfoContent = string | Record<string, never>;
type ErrorContent = string | Record<string, never>;
type RunCompletionContent = Record<string, never>;
type GenerateCodeExecutionReplyContent = Record<string, never>;
type TerminationAndHumanReplyNoInputContent = {
    no_human_input_msg: string;
    sender: string;
    recipient: string;
};
type OnContextConditionTransitionContent = {
    source_agent: string;
    transition_target: string;
};
type AfterWorksTransitionContent = {
    source_agent: string;
    transition_target: string;
};
type OnConditionLLMTransitionContent = {
    source_agent: string;
    transition_target: string;
};
type ReplyResultTransitionContent = {
    source_agent: string;
    transition_target: string;
};

type Transitionevent =
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
    | Transitionevent
    | EventBase<string, any>; // fallback/unknown

type EventConsoleProps = {
    events: WaldiezEvent[];
    /** If true, show a debug line with the raw event JSON */
    printRaw?: boolean;
    /** Auto-scroll to bottom when new events arrive (default true) */
    autoScroll?: boolean;
    /** Optional: className container */
    className?: string;
    /** theme/dark mode */
    darkMode: boolean;
};

const formatArgs = (args: unknown): string => {
    try {
        if (args === null) {
            return "none";
        }
        if (typeof args === "string") {
            return args;
        }
        return JSON.stringify(args);
    } catch {
        return String(args);
    }
};

const ResumeSpinner = () => {
    // 2s spinner animation like your Python loop, but non-blocking/UI-friendly
    const [phase, setPhase] = useState<"spin" | "done">("spin");
    useEffect(() => {
        const t = setTimeout(() => setPhase("done"), 2000);
        return () => clearTimeout(t);
    }, []);
    return phase === "spin" ? (
        <div className="flex items-center gap-2">
            <span className="animate-spin inline-block">⏳</span>
            <span>Resuming a previously stored state…</span>
        </div>
    ) : (
        <div>✅ Resume complete!</div>
    );
};

const getParticipants = (ev: WaldiezEvent) => {
    const sender = ev.sender || ev.content.sender;
    const recipient = ev.recipient || ev.content.recipient;
    return { sender, recipient };
};

// eslint-disable-next-line max-statements, complexity
const renderEvent = (ev: WaldiezEvent, darkMode: boolean) => {
    if (!ev.type) {
        const nested = ev as any;
        if (nested.event && nested.event.type) {
            return renderEvent(nested.event, darkMode);
        }
    }
    switch (ev.type) {
        case "empty": {
            const c = ev as TextContent;
            const content = getContentString(c);
            return <div className="text-gray-700 font-large">{content}</div>;
        }
        case "text": {
            const c = ev.content as TextContent;
            const { sender, recipient } = getParticipants(ev);
            if (!sender || !recipient || sender === recipient) {
                return null;
            }
            const content = getContentString(c);
            return (
                <div>
                    <div className="text-amber-500 font-semibold">
                        {sender} <span className="text-gray-400">→</span> {recipient}
                    </div>
                    <pre className="whitespace-pre-wrap break-words mt-1">{content}</pre>
                </div>
            );
        }

        case "post_carryover_processing": {
            const c = ev.content as PostCarryoverContent;
            const { sender, recipient } = getParticipants(ev);
            return (
                <div>
                    <div className="text-pink-500 font-semibold">
                        {sender} <span className="text-gray-400">→</span> {recipient}
                    </div>
                    <pre className="whitespace-pre-wrap break-words mt-1">{c.message}</pre>
                </div>
            );
        }

        case "group_chat_run_chat": {
            const c = ev.content as GroupChatRunChatContent;
            return (
                <div className="text-green-600 font-semibold">
                    Next speaker: {(ev as any).speaker || c.speaker}
                </div>
            );
        }

        case "using_auto_reply": {
            const { sender, recipient } = getParticipants(ev);
            return (
                <div className="text-gray-700">
                    sender={sender}, recipient={recipient}
                </div>
            );
        }

        case "select_speaker": {
            return (
                <div className="text-gray-700">
                    <Markdown
                        content={WaldiezChatMessageUtils.generateSpeakerSelectionMarkdown(ev.content.agents)}
                        isDarkMode={darkMode}
                    />
                </div>
            );
        }

        case "tool_call": {
            const c = ev.content as ToolCallContent;
            const { sender, recipient } = getParticipants(ev);
            return (
                <div>
                    <div className="text-gray-700 mb-1">
                        <span className="font-medium">{sender}</span> <span className="text-gray-400">→</span>{" "}
                        <span className="font-medium">{recipient}</span>
                    </div>
                    <div className="space-y-1">
                        {c.tool_calls?.map((tc, i) => {
                            const args =
                                tc.function.arguments && tc.function.arguments !== "{}"
                                    ? tc.function.arguments
                                    : "none";
                            return (
                                <div key={i} className="flex items-start gap-2">
                                    <span>🔧</span>
                                    <div>
                                        <div className="font-semibold">Calling: {tc.function.name}</div>
                                        <div className="text-xs text-gray-600 break-words">args: {args}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        case "execute_function": {
            const c = ev.content as ExecuteFunctionContent;
            const { recipient } = getParticipants(ev);
            return (
                <div>
                    <div className="font-semibold">⚡ Executing: {c.func_name}</div>
                    <div className="text-sm text-gray-700">→ Target: {recipient}</div>
                    <div className="text-xs text-gray-600 break-words">
                        → Args: {formatArgs((ev as any).arguments || c.arguments)}
                    </div>
                </div>
            );
        }
        case "executed_function": {
            const c = (ev as any).content
                ? (ev.content as ExecutedFunctionContent)
                : (ev as any as ExecutedFunctionContent);
            const ok = "is_exec_success" in c ? !!c.is_exec_success : true;
            const transferred =
                typeof c.content === "object" && c.content && "agent_name" in c.content
                    ? (c.content as any).agent_name
                    : undefined;
            const recipient = typeof c.recipient === "string" ? c.recipient : undefined;
            const details = c.func_name || getContentString(c);
            return (
                <div>
                    <div className={ok ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {ok ? "✅ Success" : "❌ Failed"}: {details}
                    </div>
                    {transferred && <div className="text-sm">→ Transferred to: {transferred}</div>}
                    {!transferred && recipient && (
                        <div className="text-sm">→ Transferring to: {recipient} </div>
                    )}
                </div>
            );
        }

        case "input_request":
        case "debug_input_request": {
            const c = (ev as any).content
                ? (ev.content as InputRequestContent)
                : (ev as any as InputRequestContent);
            return (
                <div>
                    <div className="font-semibold">👤 Provide your input:</div>
                    {c.prompt && <div className="text-sm">{c.prompt}</div>}
                    {/* The actual input is rendered in the sticky footer; this is just the log line */}
                </div>
            );
        }

        case "tool_response": {
            const c = (ev as any).content
                ? (ev.content as ToolResponseContent)
                : (ev as any as ToolResponseContent);
            const { sender, recipient } = getParticipants(ev);
            return (
                <div>
                    <div>🔄 Tool Response:</div>
                    <pre className="whitespace-pre-wrap break-words">{c.content}</pre>
                    <div className="text-xs">
                        → From: {sender} to {recipient}
                    </div>
                </div>
            );
        }

        case "termination": {
            const c = (ev as any).content
                ? (ev.content as TerminationContent)
                : (ev as any as TerminationContent);
            return (
                <div>
                    <div className="font-semibold">Termination met</div>
                    {c.termination_reason && (
                        <div className="text-sm">→ Termination_reason: {c.termination_reason}</div>
                    )}
                </div>
            );
        }

        case "termination_and_human_reply_no_input": {
            const c = (ev as any).content
                ? (ev.content as TerminationAndHumanReplyNoInputContent)
                : (ev as any as TerminationAndHumanReplyNoInputContent);
            return (
                <div>
                    <div className="font-semibold">No human input</div>
                    {c.no_human_input_msg && <div className="text-sm">→ Message: {c.no_human_input_msg}</div>}
                </div>
            );
        }

        case "run_completion":
            return <div className="font-semibold">🏁 Run completed</div>;

        case "generate_code_execution_reply":
            return <div className="font-semibold">💻 Code executed</div>;

        case "group_chat_resume":
            return <ResumeSpinner />;

        case "on_condition_l_l_m_transition":
        case "on_condition_llm_transition":
        case "on_context_condition_transition":
        case "after_works_transition":
        case "reply_result_transition":
            return renderTransitionEvent(ev);

        case "info":
            return (
                <div className="info">
                    {typeof ev.content === "string" ? ev.content : JSON.stringify(ev.content)}
                </div>
            );

        case "error":
            if (!(ev as any).content && (ev as any).error) {
                return <div className="error">{(ev as any).error}</div>;
            }
            return (
                <div className="error">
                    {typeof ev.content === "string" ? ev.content : JSON.stringify(ev.content)}
                </div>
            );
        default:
            return (
                <div className="text-amber-700">
                    ⚠️ Unknown event type: <span className="font-mono">{ev.type}</span>
                    <pre className="text-xs text-blue-600/80 mb-2 break-words">
                        Raw event: {JSON.stringify(ev, null, 2)}
                    </pre>
                </div>
            );
    }
};

const renderTransitionEvent = (ev: WaldiezEvent) => {
    let target = (ev as Transitionevent).content.transition_target || (ev as any).transition_target;
    const source = (ev as Transitionevent).content.source_agent || (ev as any).source_agent;
    if (typeof target !== "string") {
        const { recipient } = getParticipants(ev);
        if (typeof recipient === "string") {
            target = recipient;
        }
    }
    const eventDisplay = getEventDisplay(ev.type);
    if (typeof target === "string") {
        if (typeof source === "string") {
            return (
                <div className="font-semibold text-blue-600/80">
                    {eventDisplay} ({source}): Hand off to {target}
                </div>
            );
        }
        return (
            <div className="font-semibold text-blue-600/80">
                {eventDisplay}: Hand off to {target}
            </div>
        );
    }
    return null;
};

const getEventDisplay = (eventType: string) => {
    if (["on_condition_l_l_m_transition", "on_condition_llm_transition"].includes(eventType)) {
        return "LLMTransition Handoff";
    }
    if (eventType === "on_context_condition_transition") {
        return "ContextCondition Handoff";
    }
    if (eventType === "after_works_transition") {
        return "AfterWork Handoff";
    }
    if (eventType === "reply_result_transition") {
        return "ReplyResult";
    }
    return eventType;
};

export const EventConsole: FC<EventConsoleProps> = ({
    events,
    printRaw,
    autoScroll,
    className,
    darkMode,
}) => {
    const listRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const userScrolledUpRef = useRef(false);

    useEffect(() => {
        const el = listRef.current;
        if (!el) {
            return;
        }

        const onScroll = () => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            userScrolledUpRef.current = !nearBottom;
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToBottom = (smooth: boolean) => {
        const el = listRef.current;
        const end = endRef.current;
        if (!el || !end) {
            return;
        }

        if (typeof end.scrollIntoView === "function") {
            end.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
            return;
        }
        el.scrollTop = el.scrollHeight - el.clientHeight;
    };

    useLayoutEffect(() => {
        if (!autoScroll || userScrolledUpRef.current) {
            return;
        }

        // Double RAF to ensure DOM is fully rendered
        requestAnimationFrame(() => {
            requestAnimationFrame(() => scrollToBottom(true));
        });
    }, [events, autoScroll]);

    return (
        <div
            className={["flex items-center flex-col h-full json", className].filter(Boolean).join(" ")}
            data-testid="events-console"
        >
            <div ref={listRef} className="flex-1 w-full overflow-auto text-sm font-mono leading-5">
                <div className="p-3 space-y-3">
                    {events.map((ev, idx) => (
                        <div key={ev.id ?? idx} className={ev.type === "empty" ? "center" : "entry"}>
                            {printRaw && (
                                <div className="text-xs text-blue-600/80 mb-2 break-words">
                                    Raw event: {JSON.stringify(ev, null, 2)}
                                </div>
                            )}
                            {renderEvent(ev, darkMode)}
                        </div>
                    ))}
                </div>
                <div ref={endRef} className="scroll-anchor p-3" />
            </div>
        </div>
    );
};
