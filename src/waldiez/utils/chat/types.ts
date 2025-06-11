/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatMessage, WaldiezMediaContent } from "@waldiez/types";

export interface IBaseMessageData {
    type: string;
    id?: string;
    timestamp?: string;
}

export interface IInputRequestData extends IBaseMessageData {
    type: "input_request";
    request_id: string;
    prompt: string;
    password?: boolean | string;
}

export interface IPrintMessageData extends IBaseMessageData {
    type: "print";
    content: {
        data: string;
    };
}

export interface ITextMessageData extends IBaseMessageData {
    type: "text" | "tool_call";
    content: {
        content: WaldiezMediaContent;
        sender: string;
        recipient: string;
    };
}

export interface ITerminationMessageData extends IBaseMessageData {
    type: "termination";
    content: {
        termination_reason: string;
    };
}

export interface IGroupChatRunData extends IBaseMessageData {
    type: "group_chat_run_chat";
    content: {
        uuid: string;
        speaker: string;
        silent?: boolean;
    };
}

export interface ISpeakerSelectionData extends IBaseMessageData {
    type: "select_speaker" | "select_speaker_invalid_input";
    content: {
        uuid: string;
        agents: string[];
    };
}

export interface ICodeExecutionReplyData extends IBaseMessageData {
    type: "generate_code_execution_reply";
    content: {
        uuid: string;
        code_blocks?: string[];
        sender: string;
        recipient: string;
    };
}

export interface IProcessResult {
    message?: WaldiezChatMessage;
    requestId?: string | null;
    isWorkflowEnd?: boolean;
    participants?: {
        users: string[];
        all: string[];
    };
}

export interface IParticipantsData {
    participants: Array<{
        name: string;
        [key: string]: any;
    }>;
}

// Message handler interface
export interface IMessageHandler {
    canHandle(type: string): boolean;
    handle(data: any, context: IMessageProcessingContext): IProcessResult | undefined;
}

export interface IMessageProcessingContext {
    requestId?: string | null;
    imageUrl?: string;
}
