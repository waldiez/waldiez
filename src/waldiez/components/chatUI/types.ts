/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";

/**
 * Supported media types
 * @param text - Text content
 * @param image - Image content
 * @param video - Video content
 * @param audio - Audio content
 * @param file - File content
 * @param document - Document content
 * @param string - Other string types
 */
export type WaldiezMediaType = "text" | "image" | "video" | "audio" | "file" | (string & {});

/**
 * Media content wrapper
 * @param type - Type of the media content (text, image, video, audio, file)
 * @param text - Text content (if type is "text")
 * @param image - Image content (if type is "image")
 * @param video - Video content (if type is "video")
 * @param audio - Audio content (if type is "audio")
 * @param file - File content (if type is "file")
 * @param url - URL of the media content
 * @param file - File object of the media content
 * @param alt - Alt text for the image
 * @param duration - Duration of the video or audio content
 * @param mimeType - MIME type of the video or audio content
 * @param name - Name of the file
 * @param size - Size of the file
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
          type: "file";
          file: {
              url?: string;
              file?: File;
              name: string;
              size?: number;
              type?: string;
              previewUrl?: string;
          };
      }
    | string;

/**
 * Supported message types
 * @param user - User message
 * @param agent - Agent message
 * @param system - System message
 * @param input_request - Input request message
 * @param input_response - Input response message
 * @param run_completion - Run completion indication
 * @param error - Error message
 * @param print - Print message
 * @param text - Text message
 */
export type WaldiezChatMessageType =
    | "user"
    | "agent"
    | "system"
    | "input_request"
    | "input_response"
    | "run_completion"
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

/**
 * WaldiezChatContent structure
 * This type can be a single media content, an array of media contents,
 * or a string. It is used to represent the content of a chat message.
 * @see {@link WaldiezMediaContent}
 */
export type WaldiezChatContent =
    | WaldiezMediaContent
    | WaldiezMediaContent[]
    | { content: WaldiezMediaContent | WaldiezMediaContent[] | string }
    | string;

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
 * @see {@link WaldiezChatMessageCommon}
 * @see {@link WaldiezMediaContent}
 */
export type WaldiezChatMessage = WaldiezChatMessageCommon & {
    content: WaldiezChatContent;
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
    onUserInput?: (input: WaldiezChatUserInput) => void | Promise<void> | boolean | Promise<boolean>;
    onMediaUpload?: (media: WaldiezMediaContent) => Promise<string>;
    onChatError?: (error: WaldiezChatError) => void | Promise<void>;
    onMessageStreamEvent?: (event: WaldiezStreamEvent) => void | Promise<void>;
    onInterrupt?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
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
 * Chat participant data.
 * @param id - The unique identifier for the participant.
 * @param name - The name of the participant.
 * @param isUser - Indicates if the participant is a user.
 */
export type WaldiezChatParticipant = {
    id: string;
    name: string;
    isUser: boolean;
};

/**
 * Chat configuration type
 * @param show - Whether to display the chat UI
 * @param active - Whether the flow has running
 * @param messages - Array of chat messages
 * @param userParticipants - Set of user participants
 * @param activeRequest - Active request information (if any)
 * @param error - Error information (if any)
 * @param handlers - Chat-specific handlers
 * @param mediaConfig - Media handling configuration
 */
export type WaldiezChatConfig = {
    // Whether to display the chat UI
    show: boolean;

    // Whether the flow is running
    active: boolean;

    // Chat content
    messages: WaldiezChatMessage[];
    userParticipants: string[] | WaldiezChatParticipant[];

    // Current input request (if any)
    activeRequest?: WaldiezActiveRequest;

    // Error display (if any)
    error?: WaldiezChatError;

    // Chat-specific handlers
    handlers?: WaldiezChatHandlers;

    // Timeline data generated after the chat
    timeline?: WaldiezTimelineData;

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
    userParticipants: string[] | WaldiezChatParticipant[];
    isDarkMode: boolean;
    handlers?: WaldiezChatHandlers;
    activeRequest?: WaldiezActiveRequest;
    error?: WaldiezChatError;
    mediaConfig?: WaldiezMediaConfig;
};
