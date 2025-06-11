/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    ICodeExecutionReplyData,
    IGroupChatRunData,
    IInputRequestData,
    IParticipantsData,
    IPrintMessageData,
    ISpeakerSelectionData,
    ITerminationMessageData,
    ITextMessageData,
} from "@waldiez/utils/chat/types";

export class MessageValidator {
    static isValidInputRequest(data: any): data is IInputRequestData {
        return (
            data &&
            typeof data === "object" &&
            data.type === "input_request" &&
            typeof data.request_id === "string" &&
            typeof data.prompt === "string"
        );
    }

    static isValidPrintMessage(message: any): message is IPrintMessageData {
        console.debug("Validating print message data:", message);
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

    static isValidTextMessage(data: any): data is ITextMessageData {
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

    static isValidTerminationMessage(data: any): data is ITerminationMessageData {
        return (
            data &&
            typeof data === "object" &&
            data.type === "termination" &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.termination_reason === "string"
        );
    }

    static isValidGroupChatRun(data: any): data is IGroupChatRunData {
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

    static isValidSpeakerSelection(data: any): data is ISpeakerSelectionData {
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

    static isValidCodeExecutionReply(data: any): data is ICodeExecutionReplyData {
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

    static isValidParticipantsData(data: any): data is IParticipantsData {
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
