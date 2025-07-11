/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { parseMessageContent } from "@waldiez/components/chatUI/utils/messageParser";

// Mock ImageWithRetry and Markdown
vi.mock("@waldiez/components/chatUI/imageWithRetry", () => ({
    ImageWithRetry: ({ src, onClick }: any) => (
        <img data-testid="image" src={src} onClick={() => onClick(src)} />
    ),
}));

vi.mock("@waldiez/components/markdown", () => ({
    Markdown: ({ content }: any) => <div data-testid="markdown">{content}</div>,
}));

describe("parseMessageContent", () => {
    it("renders structured content with text and image", () => {
        const data = [
            { type: "text", text: "Hello world" },
            { type: "image", image: { url: "https://img.jpg" } },
        ];

        const { getByText, getByTestId } = render(<>{parseMessageContent(data, false, vi.fn())}</>);

        expect(getByText("Hello world")).toBeInTheDocument();
        expect(getByTestId("image")).toHaveAttribute("src", "https://img.jpg");
    });

    it("renders inline image from [Image: url] pattern", () => {
        const content = "Here is an image: [Image: https://x.jpg]";

        const { getByTestId } = render(<>{parseMessageContent(content, false, vi.fn())}</>);

        expect(getByTestId("image")).toHaveAttribute("src", "https://x.jpg");
    });

    it("handles JSON string with valid structure", () => {
        const content = JSON.stringify([{ type: "text", text: "Nice" }]);

        const { getByText } = render(<>{parseMessageContent(content, false, vi.fn())}</>);

        expect(getByText("Nice")).toBeInTheDocument();
    });

    it("calls onImageClick when image is clicked", () => {
        const mockClick = vi.fn();
        const content = "Test [Image: https://img2.png]";

        const { getByTestId } = render(<>{parseMessageContent(content, false, mockClick)}</>);

        getByTestId("image").click();
        expect(mockClick).toHaveBeenCalledWith("https://img2.png");
    });
});
