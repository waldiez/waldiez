import { beforeEach, describe, expect, it, vi } from "vitest";

import { MessageUtils } from "@waldiez/utils/chat/MessageUtils";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";

// Mock nanoid
vi.mock("nanoid", () => ({
    nanoid: () => "mocked-id",
}));

describe("MessageUtils", () => {
    describe("isPasswordPrompt", () => {
        it("returns true for boolean true", () => {
            expect(MessageUtils.isPasswordPrompt({ password: true })).toBe(true);
        });
        it("returns true for string 'true'", () => {
            expect(MessageUtils.isPasswordPrompt({ password: "true" })).toBe(true);
        });
        it("returns false for invalid values", () => {
            expect(MessageUtils.isPasswordPrompt({})).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: "false" })).toBe(false);
            expect(MessageUtils.isPasswordPrompt({ password: 123 })).toBe(false);
        });
    });

    describe("normalizePrompt", () => {
        it("replaces generic prompt with default", () => {
            const prompt = MESSAGE_CONSTANTS.GENERIC_PROMPTS[0];
            expect(MessageUtils.normalizePrompt(prompt)).toBe(MESSAGE_CONSTANTS.DEFAULT_PROMPT);
        });
        it("returns custom prompt as-is", () => {
            expect(MessageUtils.normalizePrompt("CustomPrompt")).toBe("CustomPrompt");
        });
    });

    describe("generateMessageId", () => {
        it("returns provided id", () => {
            expect(MessageUtils.generateMessageId({ id: "abc" })).toBe("abc");
        });
        it("falls back to uuid", () => {
            expect(MessageUtils.generateMessageId({ uuid: "uuid-1" })).toBe("uuid-1");
        });
        it("generates a new id if none is given", () => {
            expect(MessageUtils.generateMessageId({})).toBe("mocked-id");
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
            expect(MessageUtils.generateTimestamp({ timestamp: "2023-01-01T00:00:00.000Z" })).toBe(
                "2023-01-01T00:00:00.000Z",
            );
        });

        it("generates current timestamp if not provided", () => {
            expect(MessageUtils.generateTimestamp({})).toBe("2024-01-01T12:00:00.000Z");
        });
    });

    describe("replaceImageUrls", () => {
        const url = "https://example.com/image.png";

        it("replaces <img> in string with image_url object", () => {
            const input = `<img alt="Image" />`;
            const result = MessageUtils.replaceImageUrls(input, url);
            expect(result).toEqual({
                type: "image_url",
                image_url: { url: `<img alt="Image" src="${url}" />`, alt: "Image" },
            });
        });

        it("replaces image_url in object", () => {
            const input = {
                type: "image_url",
                image_url: { url: "placeholder" },
            };
            const result = MessageUtils.replaceImageUrls(input, url);
            expect(result).toEqual({
                type: "image_url",
                image_url: { url, alt: undefined },
            });
        });

        it("replaces inside array of mixed content", () => {
            const input = [
                "hello",
                {
                    type: "image_url",
                    image_url: { url: "placeholder" },
                },
                {
                    type: "text",
                    text: "<img alt='Image' />",
                },
            ];
            const result = MessageUtils.replaceImageUrls(input, url);
            expect(result).toEqual([
                { type: "text", text: "hello" },
                { type: "image_url", image_url: { url, alt: undefined } },
                {
                    type: "image_url",
                    image_url: { url: `<img alt="Image" src="${url}" />`, alt: "Image" },
                },
            ]);
        });
    });

    describe("normalizeContent", () => {
        const imageUrl = "https://image.png";

        it("normalizes string into text", () => {
            expect(MessageUtils.normalizeContent("hello")).toEqual([{ type: "text", text: "hello" }]);
        });

        it("normalizes image string into image_url", () => {
            const input = `<img alt="Image" />`;
            expect(MessageUtils.normalizeContent(input, imageUrl)).toEqual([
                {
                    type: "image_url",
                    image_url: {
                        url: `<img alt="Image" src="${imageUrl}" />`,
                        alt: "Image",
                    },
                },
            ]);
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

        it("normalizes mixed array content", () => {
            const input = [
                { type: "text", text: "Hello" },
                { type: "image_url", image_url: { url: imageUrl, alt: "Test" } },
            ];
            expect(MessageUtils.normalizeContent(input)).toEqual([
                { type: "text", text: "Hello" },
                {
                    type: "image_url",
                    image_url: { url: imageUrl, alt: "Test" },
                },
            ]);
        });
    });

    describe("generateSpeakerSelectionMarkdown", () => {
        it("creates formatted markdown list", () => {
            const agents = ["Alice", "Bob"];
            const result = MessageUtils.generateSpeakerSelectionMarkdown(agents);

            expect(result).toContain("- [1] Alice");
            expect(result).toContain("- [2] Bob");
            expect(result).toContain(MESSAGE_CONSTANTS.SYSTEM_MESSAGES.SPEAKER_SELECTION_HEADER);
        });
    });
});
