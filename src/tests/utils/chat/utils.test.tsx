/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import { MessageUtils } from "@waldiez/utils/chat/utils";

// Mock nanoid
vi.mock("nanoid", () => ({
    nanoid: () => "mocked-id",
}));

// eslint-disable-next-line max-lines-per-function
describe("MessageUtils", () => {
    describe("isPasswordPrompt", () => {
        it("returns true for boolean true", () => {
            expect(MessageUtils.isPasswordPrompt({ password: true })).toBe(true);
        });

        it("returns false for boolean false", () => {
            expect(MessageUtils.isPasswordPrompt({ password: false })).toBe(false);
        });

        it("returns true for string 'true'", () => {
            expect(MessageUtils.isPasswordPrompt({ password: "true" })).toBe(true);
        });

        it("returns true for string 'TRUE' (case insensitive)", () => {
            expect(MessageUtils.isPasswordPrompt({ password: "TRUE" })).toBe(true);
        });

        it("returns true for string 'True' (mixed case)", () => {
            expect(MessageUtils.isPasswordPrompt({ password: "True" })).toBe(true);
        });

        it("returns false for string 'false'", () => {
            expect(MessageUtils.isPasswordPrompt({ password: "false" })).toBe(false);
        });

        it("returns false for invalid values", () => {
            expect(MessageUtils.isPasswordPrompt({})).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: null })).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: undefined })).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: 123 })).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: [] })).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: {} })).toBe(false);
        });

        it("returns false for missing password property", () => {
            expect(MessageUtils.isPasswordPrompt({ other: "value" })).toBe(false);
        });
    });

    describe("normalizePrompt", () => {
        it("replaces generic prompt '>' with default", () => {
            expect(MessageUtils.normalizePrompt(">")).toBe(MESSAGE_CONSTANTS.DEFAULT_PROMPT);
        });

        it("replaces generic prompt '> ' with default", () => {
            expect(MessageUtils.normalizePrompt("> ")).toBe(MESSAGE_CONSTANTS.DEFAULT_PROMPT);
        });

        it("returns custom prompt as-is", () => {
            expect(MessageUtils.normalizePrompt("CustomPrompt")).toBe("CustomPrompt");
        });

        it("returns empty string as-is", () => {
            expect(MessageUtils.normalizePrompt("")).toBe("");
        });

        it("returns similar but non-generic prompts as-is", () => {
            expect(MessageUtils.normalizePrompt(">>")).toBe(">>");
            expect(MessageUtils.normalizePrompt(">  ")).toBe(">  ");
            expect(MessageUtils.normalizePrompt(" >")).toBe(" >");
        });
    });

    describe("generateMessageId", () => {
        it("returns provided id", () => {
            expect(MessageUtils.generateMessageId({ id: "abc" } as any)).toBe("abc");
        });

        it("falls back to uuid when id is missing", () => {
            expect(MessageUtils.generateMessageId({ uuid: "uuid-1" } as any)).toBe("uuid-1");
        });

        it("generates a new id if none is given", () => {
            expect(MessageUtils.generateMessageId({} as any)).toBe("mocked-id");
        });

        it("prefers id over uuid when both are present", () => {
            expect(MessageUtils.generateMessageId({ id: "id-1", uuid: "uuid-1" } as any)).toBe("id-1");
        });

        it("handles empty string id by falling back to uuid", () => {
            expect(MessageUtils.generateMessageId({ id: "", uuid: "uuid-1" } as any)).toBe("uuid-1");
        });

        it("handles empty string uuid by generating new id", () => {
            expect(MessageUtils.generateMessageId({ id: "", uuid: "" } as any)).toBe("mocked-id");
        });
    });

    describe("generateTimestamp", () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("returns provided timestamp", () => {
            expect(MessageUtils.generateTimestamp({ timestamp: "2023-01-01T00:00:00.000Z" } as any)).toBe(
                "2023-01-01T00:00:00.000Z",
            );
        });

        it("generates current timestamp if not provided", () => {
            expect(MessageUtils.generateTimestamp({} as any)).toBe("2024-01-01T12:00:00.000Z");
        });

        it("handles empty string timestamp by generating new one", () => {
            expect(MessageUtils.generateTimestamp({ timestamp: "" } as any)).toBe("2024-01-01T12:00:00.000Z");
        });
    });

    describe("replaceImageUrls", () => {
        const imageUrl = "https://example.com/image.jpg";

        it("handles string content with image regex matching", () => {
            // This regex matches: <img\s+(?!.*src=)([^"'>\s]+)\s*\/?>
            // So we need an img tag without src= and with unquoted attributes
            // noinspection RequiredAttributes
            const content = "<img alt>";
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual({
                type: "image_url",
                image_url: { url: `<img alt="Image" src="${imageUrl}" />`, alt: "Image" },
            });
        });

        it("handles string content with self-closing image regex", () => {
            // noinspection RequiredAttributes
            const content = "<img alt/>";
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual({
                type: "image_url",
                image_url: { url: `<img alt="Image" src="${imageUrl}" />`, alt: "Image" },
            });
        });

        it("handles string content without image", () => {
            const content = "Hello world";
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([{ type: "text", text: "Hello world" }]);
        });

        it("handles string content with img tag that has src (should not match)", () => {
            // noinspection RequiredAttributes,HtmlUnknownTarget
            const content = '<img src="existing.jpg" alt="test">';
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([{ type: "text", text: content }]);
        });

        it("handles string content with quoted attributes (should not match)", () => {
            // noinspection RequiredAttributes
            const content = '<img alt="test" />';
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([{ type: "text", text: content }]);
        });

        it("handles array content with strings", () => {
            // noinspection RequiredAttributes
            const content = ["Hello", "<img alt>"];
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([
                { type: "text", text: "Hello" },
                {
                    type: "image_url",
                    image_url: { url: `<img alt="Image" src="${imageUrl}" />`, alt: "Image" },
                },
            ]);
        });

        it("handles array content with objects", () => {
            const content = [
                { type: "text", text: "Hello" },
                { type: "image_url", image_url: { url: "old-url" } },
            ];
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([
                { type: "text", text: "Hello" },
                { type: "image_url", image_url: { url: imageUrl } },
            ]);
        });

        it("handles array content with text objects containing images", () => {
            // noinspection RequiredAttributes
            const content = [{ type: "text", text: "<img alt>" }];
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([
                {
                    type: "image_url",
                    image_url: { url: `<img alt="Image" src="${imageUrl}" />`, alt: "Image" },
                },
            ]);
        });

        it("handles array content with invalid objects", () => {
            const content = [null, { invalid: "object" }, "valid string"];
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual([{ type: "text", text: "valid string" }]);
        });

        it("handles object with image_url type", () => {
            const content = {
                type: "image_url",
                image_url: { url: "old-url", alt: "Old Alt" },
            };
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual({
                type: "image_url",
                image_url: { url: imageUrl, alt: "Old Alt" },
            });
        });

        it("handles object with text type containing matching image", () => {
            // noinspection RequiredAttributes
            const content = {
                type: "text",
                text: "<img alt>",
            };
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual({
                type: "image_url",
                image_url: { url: `<img alt="Image" src="${imageUrl}" />`, alt: "Image" },
            });
        });

        it("handles object with text type without image", () => {
            const content = {
                type: "text",
                text: "Plain text",
            };
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual(content);
        });

        it("handles object without type property", () => {
            const content = { invalid: "object" };
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual(content);
        });

        it("handles null content", () => {
            const result = MessageUtils.replaceImageUrls(null, imageUrl);
            expect(result).toBeNull();
        });

        it("handles undefined content", () => {
            const result = MessageUtils.replaceImageUrls(undefined, imageUrl);
            expect(result).toBeUndefined();
        });

        it("handles numeric content", () => {
            const result = MessageUtils.replaceImageUrls(123, imageUrl);
            expect(result).toBe(123);
        });

        it("handles multiple images in single string (should not match)", () => {
            // noinspection RequiredAttributes
            const content = "<img alt><img alt>";
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            // Should only match single image regex, multiple images return as text
            expect(result).toEqual([{ type: "text", text: content }]);
        });

        it("handles image_url object without url property", () => {
            const content = {
                type: "image_url",
                image_url: { alt: "No URL" },
            };
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual(content);
        });

        it("handles text object without text property", () => {
            const content = {
                type: "text",
                // missing text property
            };
            const result = MessageUtils.replaceImageUrls(content, imageUrl);

            expect(result).toEqual(content);
        });
    });

    describe("normalizeContent", () => {
        const imageUrl = "https://image.png";

        it("normalizes string into text", () => {
            expect(MessageUtils.normalizeContent("hello")).toEqual([{ type: "text", text: "hello" }]);
        });

        it("normalizes string with image when imageUrl provided", () => {
            // noinspection RequiredAttributes
            const content = "<img alt>";
            const result = MessageUtils.normalizeContent(content, imageUrl);

            expect(result).toEqual([
                {
                    type: "image_url",
                    image_url: { url: `<img alt="Image" src="${imageUrl}" />`, alt: "Image" },
                },
            ]);
        });

        it("handles string with multiple images", () => {
            // noinspection RequiredAttributes
            const content = "<img alt><img alt>";
            const result = MessageUtils.normalizeContent(content, imageUrl);

            expect(result).toEqual([{ type: "text", text: content }]);
        });

        it("handles string with image but no imageUrl provided", () => {
            // noinspection RequiredAttributes
            const content = "<img alt>";
            const result = MessageUtils.normalizeContent(content);

            expect(result).toEqual([{ type: "text", text: content }]);
        });

        it("normalizes single text object", () => {
            expect(MessageUtils.normalizeContent({ type: "text", text: "Hello" })).toEqual([
                { type: "text", text: "Hello" },
            ]);
        });

        it("normalizes image_url object", () => {
            expect(
                MessageUtils.normalizeContent({
                    type: "image_url",
                    image_url: { url: imageUrl },
                }),
            ).toEqual([
                {
                    type: "image_url",
                    image_url: { url: imageUrl, alt: "Image" },
                },
            ]);
        });

        it("normalizes image_url object with existing alt text", () => {
            expect(
                MessageUtils.normalizeContent({
                    type: "image_url",
                    image_url: { url: imageUrl, alt: "Custom Alt" },
                }),
            ).toEqual([
                {
                    type: "image_url",
                    image_url: { url: imageUrl, alt: "Custom Alt" },
                },
            ]);
        });

        it("handles object without recognized type", () => {
            const content = { type: "unknown", data: "test" };
            expect(MessageUtils.normalizeContent(content as any)).toEqual([content]);
        });

        it("handles object without type property", () => {
            const content = { data: "test" };
            expect(MessageUtils.normalizeContent(content as any)).toEqual([content]);
        });

        it("handles null object", () => {
            expect(MessageUtils.normalizeContent(null as any)).toEqual([null]);
        });

        it("normalizes mixed array content", () => {
            const input = [
                { type: "text", text: "Hello" },
                { type: "image_url", image_url: { url: imageUrl, alt: "Test" } },
            ];
            expect(MessageUtils.normalizeContent(input as any)).toEqual([
                { type: "text", text: "Hello" },
                {
                    type: "image_url",
                    image_url: { url: imageUrl, alt: "Test" },
                },
            ]);
        });

        it("handles text object with non-string text", () => {
            const content = { type: "text", text: 123 };
            expect(MessageUtils.normalizeContent(content as any)).toEqual([content]);
        });

        it("handles image_url object without image_url property", () => {
            const content = { type: "image_url" };
            expect(MessageUtils.normalizeContent(content as any)).toEqual([content]);
        });

        it("handles image_url object without url in image_url", () => {
            const content = { type: "image_url", image_url: { alt: "No URL" } };
            expect(MessageUtils.normalizeContent(content as any)).toEqual([content]);
        });
    });

    describe("generateSpeakerSelectionMarkdown", () => {
        it("creates formatted markdown list", () => {
            const agents = ["Alice", "Bob"];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            expect(result).toContain("- [1] Alice");
            expect(result).toContain("- [2] Bob");
            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_HEADER);
            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_PROMPT);
            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_NOTE);
        });

        it("handles empty agent list", () => {
            const agents: string[] = [];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_HEADER);
            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_PROMPT);
            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_NOTE);
            expect(result).not.toContain("- [1]");
        });

        it("handles single agent", () => {
            const agents = ["Alice"];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            expect(result).toContain("- [1] Alice");
            expect(result).not.toContain("- [2]");
        });

        it("handles multiple agents with correct numbering", () => {
            const agents = ["Alice", "Bob", "Charlie", "David"];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            expect(result).toContain("- [1] Alice");
            expect(result).toContain("- [2] Bob");
            expect(result).toContain("- [3] Charlie");
            expect(result).toContain("- [4] David");
        });

        it("handles agents with special characters", () => {
            const agents = ["Agent-1", "Agent_2", "Agent@3"];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            expect(result).toContain("- [1] Agent-1");
            expect(result).toContain("- [2] Agent_2");
            expect(result).toContain("- [3] Agent@3");
        });

        it("formats output with proper markdown structure", () => {
            const agents = ["Alice", "Bob"];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            const lines = result.split("\n");
            expect(lines[0]).toBe(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_HEADER);
            expect(lines[1]).toBe(""); // empty line
            expect(lines[2]).toBe(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_PROMPT);
            expect(lines[3]).toBe(""); // empty line
            expect(lines[4]).toBe("- [1] Alice");
            expect(lines[5]).toBe("- [2] Bob");
            expect(lines[6]).toBe(""); // empty line
            expect(lines[7]).toBe(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_NOTE);
        });
    });
});
