/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Supported media types
 */
export type WaldiezMediaType = "text" | "image" | "video" | "audio" | "file" | "document" | (string & {});

/**
 * Media content wrapper
 */
export type WaldiezMediaContent =
    | {
          type: "text";
          text: string;
      }
    | {
          type: "image";
          image: {
              url?: string;
              file?: File;
              alt?: string;
          };
      }
    | {
          type: "image_url";
          image_url: {
              url?: string;
              file?: File;
              alt?: string;
          };
      }
    | {
          type: "video";
          video: {
              url?: string;
              file?: File;
              duration?: number;
              thumbnailUrl?: string;
              mimeType?: string;
          };
      }
    | {
          type: "audio";
          audio: {
              url?: string;
              file?: File;
              duration?: number;
              transcript?: string;
          };
      }
    | {
          type: "file" | "document";
          file: {
              url?: string;
              file?: File;
              name: string;
              size?: number;
              type?: string;
              previewUrl?: string;
          };
      };

export type WaldiezChatMessageType =
    | "user"
    | "agent"
    | "system"
    | "input_request"
    | "input_response"
    | "tool_call"
    | "tool_response"
    | "termination_and_human_reply_no_input"
    | "using_auto_reply"
    | "execute_function"
    | "generate_code_execution_reply"
    | "error"
    | "print"
    | "text"
    | (string & {}); // other types that may come from chat events

/**
 * WaldiezChatMessage structure
 * @param id - Unique identifier for the message
 * @param timestamp - Timestamp of the message
 * @param type - Type of the message (e.g., user, agent, system)
 * @param content - Content of the message (text, image, audio, etc.)
 * @param sender - Sender of the message (optional)
 * @param recipient - Recipient of the message (optional)
 * @param request_id - ID of the request associated with the message (optional)
 * @param metadata - Additional metadata associated with the message (optional)
 */
export type WaldiezChatMessageCommon = {
    id: string;
    timestamp: string | number;
    type: WaldiezChatMessageType;
    sender?: string;
    recipient?: string;
    request_id?: string;
} & {
    [key: string]: any;
};

export type WaldiezChatMessage = WaldiezChatMessageCommon & {
    content:
        | WaldiezMediaContent
        | WaldiezMediaContent[]
        | { content: WaldiezMediaContent | WaldiezMediaContent[] | string }
        | string;
};
/**
 * User input response to a specific request
 * @param id - Unique identifier for the message
 * @param timestamp - Timestamp of the message
 * @param type - Type of the message (input_response)
 * @param data - The data of the message (text, image, etc.)
 * @param sender - Sender of the message (optional)
 * @param recipient - Recipient of the message (optional)
 * @param request_id - ID of the request associated with the message (optional)
 * @param metadata - Additional metadata associated with the message (optional)
 */
export type WaldiezChatUserInput = WaldiezChatMessageCommon & {
    type: "input_response";
    data: string | { content: WaldiezMediaContent } | { content: WaldiezMediaContent }[];
};

/**
 * Error information structure
 * @param message - Error message
 * @param code - Optional error code
 */
export type WaldiezChatError = {
    message: string;
    code?: string;
};

/**
 * Streaming event structure
 * @param type - Type of the event (start, chunk, end)
 * @param messageId - ID of the message associated with the event
 * @param chunk - Optional chunk of data (for chunk events)
 */

export type WaldiezStreamEvent =
    | { type: "start"; messageId: string }
    | { type: "chunk"; messageId: string; chunk: string }
    | { type: "end"; messageId: string };

/**
 * Chat handlers type
 * @param onUserInput - Callback for user input
 * @param onMediaUpload - Callback for media uploads
 * @param onChatError - Callback for chat errors
 * @param onInterrupt - Callback for interrupt events
 * @param onMessageStreamEvent - Callback for message stream events
 */
export type WaldiezChatHandlers = {
    onUserInput?: (input: WaldiezChatUserInput) => void;
    onMediaUpload?: (media: WaldiezMediaContent) => Promise<string>;
    onChatError?: (error: WaldiezChatError) => void;
    onMessageStreamEvent?: (event: WaldiezStreamEvent) => void;
    onInterrupt?: () => void;
    onClose?: () => void;
};

/**
 * Chat media configuration
 * @param allowedTypes - Allowed media types for upload
 * @param maxFileSize - Maximum file size for uploads (in bytes)
 * @param processAudio - Whether to process audio files
 * @param transcribeAudio - Whether to transcribe audio files
 * @param previewDocuments - Whether to preview document files
 * @param acceptedMimeTypes - Accepted MIME types for each media type
 */
export type WaldiezMediaConfig = {
    allowedTypes: WaldiezMediaType[];
    maxFileSize?: number;
    processAudio?: boolean;
    transcribeAudio?: boolean;
    previewDocuments?: boolean;
    acceptedMimeTypes?: Record<WaldiezMediaType, string[]>;
};

/**
 * Active request information
 * @param request_id - ID of the request
 * @param prompt - Prompt associated with the request
 * @param acceptedMediaTypes - Accepted media types for the request
 */
export type WaldiezActiveRequest = {
    request_id: string;
    prompt: string;
    password?: boolean;
    acceptedMediaTypes?: WaldiezMediaType[];
};

/**
 * Chat configuration type
 * @param showUI - Whether to display the chat UI
 * @param messages - Array of chat messages
 * @param userParticipants - Set of user participants
 * @param activeRequest - Active request information (if any)
 * @param error - Error information (if any)
 * @param handlers - Chat-specific handlers
 * @param mediaConfig - Media handling configuration
 */
export type WaldiezChatConfig = {
    // Whether to display the chat UI
    showUI: boolean;

    // Chat content
    messages: WaldiezChatMessage[];
    userParticipants: string[];

    // Current input request (if any)
    activeRequest?: WaldiezActiveRequest;

    // Error display (if any)
    error?: WaldiezChatError;

    // Chat-specific handlers
    handlers?: WaldiezChatHandlers;

    // Media handling configuration
    mediaConfig?: WaldiezMediaConfig;
};

/**
 * Chat UI component props
 * @param messages - Array of chat messages
 * @param userParticipants - Set of user participants
 * @param activeRequest - Active request information (if any)
 * @param error - Error information (if any)
 * @param handlers - Chat-specific handlers
 * @param mediaConfig - Media handling configuration
 */
export type ChatUIProps = {
    messages: WaldiezChatMessage[];
    userParticipants: string[];
    isDarkMode: boolean;
    handlers?: WaldiezChatHandlers;
    activeRequest?: WaldiezActiveRequest;
    error?: WaldiezChatError;
    mediaConfig?: WaldiezMediaConfig;
};
