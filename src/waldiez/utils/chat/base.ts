/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    CodeExecutionReplyData,
    GroupChatRunData,
    InputRequestData,
    ParticipantsData,
    PrintMessageData,
    SpeakerSelectionData,
    TerminationMessageData,
    TextMessageData,
} from "@waldiez/utils/chat/types";

/**
 * MessageValidator class provides static methods to validate different types of chat messages.
 * It checks if the provided data conforms to the expected structure for each message type.
 */
export class MessageValidator {
    /**
     * Validates if the provided data is a valid input request message.
     * @param data - The data to validate.
     * @returns True if the data is a valid input request, false otherwise.
     */
    static isValidInputRequest(data: any): data is InputRequestData {
        return (
            data &&
            typeof data === "object" &&
            data.type === "input_request" &&
            typeof data.request_id === "string" &&
            typeof data.prompt === "string"
        );
    }

    /**
     * Validates if the provided data is a valid print message.
     * @param message - The message data to validate.
     * @returns True if the message is a valid print message, false otherwise.
     */
    static isValidPrintMessage(message: any): message is PrintMessageData {
        if (!message || typeof message !== "object") {
            return false;
        }
        if (typeof message.type !== "string" || message.type !== "print") {
            return false;
        }
        if ("data" in message && (typeof message.data === "string" || typeof message.data === "object")) {
            message.content = { data: message.data };
            return true;
        }
        if (!message.content || typeof message.content !== "object") {
            return false;
        }
        if (!message.content.data) {
            return false;
        }
        return (
            typeof message.content.data === "string" ||
            Array.isArray(message.content.data) ||
            typeof message.content.data === "object"
        );
    }

    /**
     * Validates if the provided data is a valid text message.
     * @param data - The data to validate.
     * @returns True if the data is a valid text message, false otherwise.
     */
    static isValidTextMessage(data: any): data is TextMessageData {
        return (
            data &&
            typeof data === "object" &&
            (data.type === "text" || data.type === "tool_call") &&
            data.content &&
            typeof data.content === "object" &&
            data.content.content !== undefined &&
            typeof data.content.sender === "string" &&
            typeof data.content.recipient === "string"
        );
    }

    /**
     * Validates if the provided data is a valid termination message.
     * @param data - The data to validate.
     * @returns True if the data is a valid termination message, false otherwise.
     */
    static isValidTerminationMessage(data: any): data is TerminationMessageData {
        return (
            data &&
            typeof data === "object" &&
            data.type === "termination" &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.termination_reason === "string"
        );
    }

    /**
     * Validates if the provided data is a valid group chat run message.
     * @param data - The data to validate.
     * @returns True if the data is a valid group chat run message, false otherwise.
     */
    static isValidGroupChatRun(data: any): data is GroupChatRunData {
        return (
            data &&
            typeof data === "object" &&
            data.type === "group_chat_run_chat" &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.uuid === "string" &&
            typeof data.content.speaker === "string"
        );
    }

    /**
     * Validates if the provided data is a valid speaker selection message.
     * @param data - The data to validate.
     * @returns True if the data is a valid speaker selection message, false otherwise.
     */
    static isValidSpeakerSelection(data: any): data is SpeakerSelectionData {
        return (
            data &&
            typeof data === "object" &&
            (data.type === "select_speaker" || data.type === "select_speaker_invalid_input") &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.uuid === "string" &&
            Array.isArray(data.content.agents) &&
            data.content.agents.every((agent: any) => typeof agent === "string")
        );
    }

    /**
     * Validates if the provided data is a valid code execution reply message.
     * @param data - The data to validate.
     * @returns True if the data is a valid code execution reply message, false otherwise.
     */
    static isValidCodeExecutionReply(data: any): data is CodeExecutionReplyData {
        return (
            data &&
            typeof data === "object" &&
            data.type === "generate_code_execution_reply" &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.uuid === "string" &&
            typeof data.content.sender === "string" &&
            typeof data.content.recipient === "string"
        );
    }

    /**
     * Validates if the provided data is a valid participants data.
     * @param data - The data to validate.
     * @returns True if the data is a valid participants data, false otherwise.
     */
    static isValidParticipantsData(data: any): data is ParticipantsData {
        // {"id": "861880b3021a494abc79d231c65def35", "type": "print",
        // "timestamp": "2025-06-11T10:43:50.664895", "data":
        // "{\"participants\":[
        //      {\"name\":\"user\",\"humanInputMode\":\"ALWAYS\",\"agentType\":\"user_proxy\"},
        //      {\"name\":\"assistant_1\",\"humanInputMode\":\"NEVER\",\"agentType\":\"assistant\"},
        //      {\"name\":\"assistant_2\",\"humanInputMode\":\"NEVER\",\"agentType\":\"assistant\"},
        //      {\"name\":\"assistant_3\",\"humanInputMode\":\"NEVER\",\"agentType\":\"assistant\"}
        // ]}"}
        if (
            data &&
            typeof data === "object" &&
            Array.isArray(data.participants) &&
            data.participants.length > 0 &&
            data.participants.every((p: any) => p && typeof p.name === "string")
        ) {
            return true;
        }
        if (data && typeof data === "string") {
            try {
                const parsedData = JSON.parse(data);
                return MessageValidator.isValidParticipantsData(parsedData);
            } catch {
                return false;
            }
        }
        return false;
    }
}
