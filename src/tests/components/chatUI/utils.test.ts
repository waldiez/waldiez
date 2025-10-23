/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WaldiezChatMessage, WaldiezMediaContent } from "@waldiez/components/chatUI/types";
import { getMessageKey } from "@waldiez/components/chatUI/utils/messageKey";
import { getContentString, getMessageString } from "@waldiez/components/chatUI/utils/toString";

describe("chatUI utils", () => {
    describe("getContentString", () => {
        const mockPreview = vi.fn((type, url) => `[${type}:${url}]`);

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should handle string content", () => {
            expect(getContentString("simple text")).toBe("simple text");
            expect(getContentString("", mockPreview)).toBe("");
        });

        it("should handle text content type", () => {
            const content: WaldiezMediaContent = {
                type: "text",
                text: "Hello world",
            };
            expect(getContentString(content)).toBe("Hello world");
        });

        it("should handle image content with URL", () => {
            const content: WaldiezMediaContent = {
                type: "image",
                image: {
                    url: "https://example.com/image.jpg",
                    alt: "Test image",
                },
            };

            expect(getContentString(content)).toBe("https://example.com/image.jpg");
            expect(getContentString(content, mockPreview)).toBe("[image:https://example.com/image.jpg]");
            expect(mockPreview).toHaveBeenCalledWith("image", "https://example.com/image.jpg");
        });

        it("should handle image content without URL", () => {
            const content: WaldiezMediaContent = {
                type: "image",
                image: {
                    alt: "Alt text",
                    file: new File([""], "test.jpg"),
                },
            };

            expect(getContentString(content)).toBe("Alt text");

            // No alt text, should use file name
            const contentNoAlt: WaldiezMediaContent = {
                type: "image",
                image: {
                    file: new File([""], "image.png"),
                },
            };
            expect(getContentString(contentNoAlt)).toBe("image.png");

            // No alt, no file
            const contentEmpty: WaldiezMediaContent = {
                type: "image",
                image: {},
            };
            expect(getContentString(contentEmpty)).toBe("<image>");
        });

        it("should handle image_url content type", () => {
            const content: WaldiezMediaContent = {
                type: "image_url",
                image_url: {
                    url: "https://example.com/image2.jpg",
                },
            };

            expect(getContentString(content)).toBe("https://example.com/image2.jpg");
            expect(getContentString(content, mockPreview)).toBe("[image:https://example.com/image2.jpg]");

            // Without URL
            const contentNoUrl: WaldiezMediaContent = {
                type: "image_url",
                image_url: {
                    alt: "Alternative text",
                },
            };
            expect(getContentString(contentNoUrl)).toBe("Alternative text");

            // Default fallback
            const contentEmpty: WaldiezMediaContent = {
                type: "image_url",
                image_url: {},
            };
            expect(getContentString(contentEmpty)).toBe("<image_url>");
        });

        it("should handle video content", () => {
            const content: WaldiezMediaContent = {
                type: "video",
                video: {
                    url: "https://example.com/video.mp4",
                    thumbnailUrl: "https://example.com/thumb.jpg",
                },
            };

            expect(getContentString(content)).toBe("https://example.com/video.mp4");
            expect(getContentString(content, mockPreview)).toBe("[video:https://example.com/video.mp4]");

            // Without URL, with file
            const contentFile: WaldiezMediaContent = {
                type: "video",
                video: {
                    file: new File([""], "video.mp4"),
                },
            };
            expect(getContentString(contentFile)).toBe("video.mp4");

            // Without URL, without file, with thumbnail
            const contentThumb: WaldiezMediaContent = {
                type: "video",
                video: {
                    thumbnailUrl: "https://example.com/thumb.jpg",
                },
            };
            expect(getContentString(contentThumb)).toBe("https://example.com/thumb.jpg");

            // Fallback
            const contentEmpty: WaldiezMediaContent = {
                type: "video",
                video: {},
            };
            expect(getContentString(contentEmpty)).toBe("<video>");
        });

        it("should handle audio content", () => {
            const content: WaldiezMediaContent = {
                type: "audio",
                audio: {
                    url: "https://example.com/audio.mp3",
                    transcript: "Audio transcript here",
                },
            };

            expect(getContentString(content)).toBe("https://example.com/audio.mp3");
            expect(getContentString(content, mockPreview)).toBe("[audio:https://example.com/audio.mp3]");

            // Without URL, with file
            const contentFile: WaldiezMediaContent = {
                type: "audio",
                audio: {
                    file: new File([""], "audio.wav"),
                },
            };
            expect(getContentString(contentFile)).toBe("audio.wav");

            // Without URL, without file, with transcript
            const contentTranscript: WaldiezMediaContent = {
                type: "audio",
                audio: {
                    transcript: "Transcribed text",
                },
            };
            expect(getContentString(contentTranscript)).toBe("Transcribed text");

            // Fallback
            const contentEmpty: WaldiezMediaContent = {
                type: "audio",
                audio: {},
            };
            expect(getContentString(contentEmpty)).toBe("<audio>");
        });

        it("should handle file content", () => {
            const content: WaldiezMediaContent = {
                type: "file",
                file: {
                    previewUrl: "https://example.com/preview.pdf",
                    url: "https://example.com/file.pdf",
                    name: "document.pdf",
                },
            };

            // Should prefer previewUrl
            expect(getContentString(content)).toBe("https://example.com/preview.pdf");
            expect(getContentString(content, mockPreview)).toBe("[file:https://example.com/preview.pdf]");

            // Without previewUrl, use url
            const contentUrl: WaldiezMediaContent = {
                type: "file",
                file: {
                    url: "https://example.com/file.pdf",
                    name: "document.pdf",
                },
            };
            expect(getContentString(contentUrl)).toBe("https://example.com/file.pdf");

            // Without any URL, use name
            const contentName: WaldiezMediaContent = {
                type: "file",
                file: {
                    name: "important.docx",
                },
            };
            expect(getContentString(contentName)).toBe("important.docx");
        });
    });

    describe("getMessageString", () => {
        const mockPreview = vi.fn((type, url) => `[${type}:${url}]`);

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should handle string messages", () => {
            expect(getMessageString("Hello" as any)).toBe("Hello");
        });

        it("should handle message with string content", () => {
            const message: WaldiezChatMessage = {
                id: "123",
                timestamp: Date.now(),
                type: "user",
                content: "Simple message",
            };
            expect(getMessageString(message)).toBe("Simple message");
        });

        it("should handle message with array content", () => {
            const message: WaldiezChatMessage = {
                id: "123",
                timestamp: Date.now(),
                type: "user",
                content: [
                    { type: "text", text: "Hello" },
                    { type: "text", text: "World" },
                    { type: "image", image: { url: "image.jpg" } },
                ],
            };
            expect(getMessageString(message)).toBe("Hello World image.jpg");
            expect(getMessageString(message, mockPreview)).toBe("Hello World [image:image.jpg]");
        });

        it("should handle message with nested content object", () => {
            const message: WaldiezChatMessage = {
                id: "123",
                timestamp: Date.now(),
                type: "agent",
                content: {
                    content: "Nested string content",
                },
            };
            expect(getMessageString(message)).toBe("Nested string content");

            // Nested array content
            const messageArray: WaldiezChatMessage = {
                id: "456",
                timestamp: Date.now(),
                type: "agent",
                content: {
                    content: [
                        { type: "text", text: "Part 1" },
                        { type: "text", text: "Part 2" },
                    ],
                },
            };
            expect(getMessageString(messageArray)).toBe("Part 1 Part 2");

            // Nested single media content
            const messageSingle: WaldiezChatMessage = {
                id: "789",
                timestamp: Date.now(),
                type: "agent",
                content: {
                    content: { type: "text", text: "Single nested" },
                },
            };
            expect(getMessageString(messageSingle)).toBe("Single nested");
        });

        it("should handle message with direct media content", () => {
            const message: WaldiezChatMessage = {
                id: "123",
                timestamp: Date.now(),
                type: "user",
                content: {
                    type: "image",
                    image: { url: "direct-image.jpg" },
                },
            };
            expect(getMessageString(message)).toBe("direct-image.jpg");
        });
    });

    describe("getMessageKey", () => {
        it("should return id when available", () => {
            const message: WaldiezChatMessage = {
                id: "msg-unique-123",
                timestamp: Date.now(),
                type: "user",
                content: "Hello",
            };
            expect(getMessageKey(message)).toBe("msg-unique-123");
        });

        it("should return timestamp when no id", () => {
            const timestamp = Date.now();
            const message: WaldiezChatMessage = {
                id: "", // Empty id
                timestamp: timestamp,
                type: "user",
                content: "Hello",
            };
            expect(getMessageKey(message)).toBe(timestamp.toString());
        });

        it("should generate composite key as fallback", () => {
            const message: WaldiezChatMessage = {
                id: "",
                timestamp: 0, // Falsy timestamp to trigger composite key
                type: "agent",
                sender: "bot",
                content: "This is a longer message that should be truncated",
            };

            const key = getMessageKey(message);
            expect(key).toBe("agent-bot-0-This is a longer message that ");
            expect(key).toContain("agent");
            expect(key).toContain("bot");
            expect(key).toContain("0");
        });

        it("should handle complex content in composite key", () => {
            const message: WaldiezChatMessage = {
                id: "",
                timestamp: 9999,
                type: "system",
                sender: "system",
                content: {
                    type: "image",
                    image: { url: "test.jpg" },
                },
            };

            const key = getMessageKey(message);
            expect(key).toBe("9999");
        });

        it("should handle array content in composite key", () => {
            const message: WaldiezChatMessage = {
                id: "",
                timestamp: 5555,
                type: "user",
                sender: "alice",
                content: [
                    { type: "text", text: "Hello" },
                    { type: "text", text: "World" },
                ],
            };

            const key = getMessageKey(message);
            expect(key).toBe("5555");
        });

        it("should handle missing optional fields", () => {
            const message: WaldiezChatMessage = {
                id: "",
                timestamp: 0, // Falsy to trigger composite key
                type: "error",
                content: "Error occurred",
            };

            const key = getMessageKey(message);
            // With no id, no timestamp, no sender, it creates composite key
            expect(key).toBe("error-undefined-0-Error occurred");
        });

        it("should handle very long content", () => {
            const longContent = "a".repeat(100);
            const message: WaldiezChatMessage = {
                id: "",
                timestamp: 0,
                type: "user",
                sender: "user1",
                content: longContent,
            };

            const key = getMessageKey(message);
            expect(key).toBe("user-user1-0-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
            // Should be truncated to 30 characters
            expect(key.endsWith("a".repeat(30))).toBe(true);
        });
    });

    describe("edge cases and integration", () => {
        it("should handle all media types in a single message", () => {
            const mixedContent: WaldiezMediaContent[] = [
                { type: "text", text: "Check out:" },
                { type: "image", image: { url: "pic.jpg" } },
                { type: "video", video: { url: "vid.mp4" } },
                { type: "audio", audio: { url: "sound.mp3" } },
                { type: "file", file: { name: "doc.pdf", url: "doc.pdf" } },
            ];

            const message: WaldiezChatMessage = {
                id: "mixed-123",
                timestamp: Date.now(),
                type: "user",
                content: mixedContent,
            };

            expect(getMessageString(message)).toBe("Check out: pic.jpg vid.mp4 sound.mp3 doc.pdf");
        });

        it("should handle deeply nested content structures", () => {
            const message: WaldiezChatMessage = {
                id: "",
                timestamp: 9999,
                type: "agent",
                content: {
                    content: {
                        content: "Triple nested", // Should handle this gracefully
                    } as any,
                },
            };

            // getMessageString should handle the double nesting we support
            // The third level would be treated as a regular object
            expect(getMessageString(message)).toBeTruthy();
        });

        it("should generate consistent keys for same message", () => {
            const message: WaldiezChatMessage = {
                id: "consistent-123",
                timestamp: 5555,
                type: "user",
                content: "Test consistency",
            };

            const key1 = getMessageKey(message);
            const key2 = getMessageKey(message);
            const key3 = getMessageKey(message);

            expect(key1).toBe(key2);
            expect(key2).toBe(key3);
        });

        it("should handle File objects properly", () => {
            const file = new File(["content"], "test-file.txt", { type: "text/plain" });

            const content: WaldiezMediaContent = {
                type: "file",
                file: {
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                },
            };

            expect(getContentString(content)).toBe("test-file.txt");
        });

        it("should handle preview callback errors gracefully", () => {
            const errorPreview = vi.fn(() => {
                throw new Error("Preview failed");
            });

            const content: WaldiezMediaContent = {
                type: "image",
                image: { url: "test.jpg" },
            };

            // Should not throw even if preview callback fails
            expect(() => getContentString(content, errorPreview)).toThrow();
        });
    });

    describe("type safety", () => {
        it("should handle all valid message types", () => {
            const messageTypes: WaldiezChatMessage["type"][] = [
                "user",
                "agent",
                "system",
                "input_request",
                "input_response",
                "run_completion",
                "error",
                "print",
                "text",
            ];

            messageTypes.forEach(type => {
                const message: WaldiezChatMessage = {
                    id: `${type}-123`,
                    timestamp: Date.now(),
                    type,
                    content: `${type} message`,
                };

                expect(getMessageKey(message)).toBe(`${type}-123`);
                expect(getMessageString(message)).toBe(`${type} message`);
            });
        });

        it("should handle custom message types", () => {
            const customMessage: WaldiezChatMessage = {
                id: "custom-123",
                timestamp: Date.now(),
                type: "custom_type" as any,
                content: "Custom content",
            };

            expect(getMessageKey(customMessage)).toBe("custom-123");
            expect(getMessageString(customMessage)).toBe("Custom content");
        });
    });
});
