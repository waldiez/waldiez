/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */
import {
    WaldiezChatMessage,
    WaldiezChatParticipant,
    WaldiezMediaContent,
    WaldiezTimelineData,
} from "@waldiez/types";

/**
 * Base message data structure
 * This is the common structure for all message types.
 * It includes the type of message, an optional ID, and a timestamp.
 * @param type - The type of the message (e.g., "input_request", "print", etc.)
 * @param id - An optional unique identifier for the message.
 * @param timestamp - An optional timestamp indicating when the message was created.
 */
export type BaseMessageData = {
    type: string;
    id?: string;
    uuid?: string;
    timestamp?: string;
};

/**
 * Input request data.
 * @param type - The type of the message: "input_request"
 * @param request_id - A unique identifier for the request.
 * @param prompt - The prompt text that the user is expected to respond to.
 * @param password - Optional. If true, indicates that the input is a password field.
 */
export type InputRequestData = BaseMessageData & {
    type: "input_request";
    request_id: string;
    prompt: string;
    password?: boolean | string;
};

/**
 * Print message data.
 * @param type - The type of the message: "print"
 * @param content - The content of the print message, which can be a string or an object.
 * @param content.data - The data that was printed, which can be a string, an array, or an object.
 */
export type PrintMessageData = BaseMessageData & {
    type: "print";
    content: {
        data: string;
    };
};

/**
 * Text message data.
 * @param type - The type of the message: "text" or "tool_call"
 * @param content - The content of the text message.
 * @param content.content - The media content of the message, which can include text, images, etc.
 * @param content.sender - The sender of the message.
 * @param content.recipient - The recipient of the message.
 */
export type TextMessageData = BaseMessageData & {
    type: "text" | "tool_call";
    content: {
        content: WaldiezMediaContent;
        sender: string;
        recipient: string;
    };
};

/**
 * Termination message data.
 * @param type - The type of the message: "termination"
 * @param content - The content of the termination message.
 * @param content.termination_reason - The reason for the termination.
 */
export type TerminationMessageData = BaseMessageData & {
    type: "termination";
    content?: {
        termination_reason: string;
    };
    termination_reason?: string;
};

/**
 * Group chat run data.
 * @param type - The type of the message: "group_chat_run_chat"
 * @param content - The content of the group chat run message.
 * @param content.uuid - A unique identifier for the group chat run.
 * @param content.speaker - The speaker of the message.
 * @param content.silent - Optional. If true, indicates that the message is silent.
 */
export type GroupChatRunData = BaseMessageData & {
    type: "group_chat_run_chat";
    content: {
        uuid: string;
        speaker: string;
        silent?: boolean;
    };
};

/**
 * Speaker selection data.
 * @param type - The type of the message: "select_speaker" or "select_speaker_invalid_input"
 * @param content - The content of the speaker selection message.
 * @param content.uuid - A unique identifier for the speaker selection.
 * @param content.agents - An array of agent names available for selection.
 */
export type SpeakerSelectionData = BaseMessageData & {
    type: "select_speaker" | "select_speaker_invalid_input";
    content: {
        uuid: string;
        agents: string[];
    };
};

/**
 * Code execution reply data.
 * @param type - The type of the message: "generate_code_execution_reply"
 * @param content - The content of the code execution reply message.
 * @param content.uuid - A unique identifier for the code execution reply.
 * @param content.code_blocks - Optional. An array of code blocks returned by the execution.
 * @param content.sender - The sender of the code execution reply.
 * @param content.recipient - The recipient of the code execution reply.
 */
export type CodeExecutionReplyData = BaseMessageData & {
    type: "generate_code_execution_reply";
    content: {
        uuid: string;
        code_blocks?: string[];
        sender: string;
        recipient: string;
    };
};

/**
 * Run completion results.
 * @param summary - A summary of the run completion.
 * @param history - The history of messages exchanged during the run.
 * @param cost - The cost associated with the run.
 */
export type RunCompletionResults = {
    summary: string;
    history: {
        content: string;
        role: string;
        name?: string;
    }[];
    cost: any;
};

/**
 * Waldiez chat message type.
 * This is the main type used to represent a chat message in Waldiez.
 * It includes the ID, timestamp, type, content, sender, recipient, and request ID.
 * @param message - The processed chat message if available.
 * @param request_id - An optional request ID associated with the message.
 * @param participants - Optional. An object containing participants' data.
 * @param isWorkflowEnd - Optional. If true, indicates that the workflow has ended.
 * @see {@link WaldiezChatMessage}
 */
export type WaldiezChatMessageProcessingResult = {
    message?: WaldiezChatMessage;
    requestId?: string | null;
    isWorkflowEnd?: boolean;
    timeline?: WaldiezTimelineData;
    runCompletion?: RunCompletionResults;
    participants?: WaldiezChatParticipant[];
};

/**
 * Participants data structure.
 * This structure is used to represent the participants in a chat.
 * It includes an array of participant objects, each with a name and additional properties.
 * @param participants - An array of participant objects.
 * @param participants.name - The name of the participant.
 */
export type ParticipantsData = {
    participants: Array<{
        name: string;
        [key: string]: any;
    }>;
};

// Message handler interface
/**
 * Message handler interface.
 * This interface defines the methods that a message handler must implement.
 */
export type MessageHandler = {
    canHandle(type: string): boolean;
    handle(data: any, context: MessageProcessingContext): WaldiezChatMessageProcessingResult | undefined;
};

/**
 * Context for processing messages.
 * This context is passed to message handlers during processing.
 * It can include an optional request ID and an optional image URL.
 * @param requestId - An optional request ID associated with the message.
 * @param imageUrl - An optional image URL associated with the message.
 */
export type MessageProcessingContext = {
    requestId?: string | null;
    imageUrl?: string;
};
