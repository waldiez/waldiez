/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageWithRetry } from "@waldiez/components/chatUI/imageWithRetry";

// Mock the hook
const mockRegisterImage = vi.fn();
vi.mock("@waldiez/components/chatUI/hooks", () => ({
    useImageRetry: () => ({
        registerImage: mockRegisterImage,
    }),
}));

describe("ImageWithRetry", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders and registers the image", () => {
        const { getByAltText } = render(<ImageWithRetry src="https://example.com/image.jpg" alt="Example" />);

        const img = getByAltText("Example") as HTMLImageElement;
        expect(img).toBeInTheDocument();
        expect(img.src).toContain("example.com/image.jpg");
        expect(img.classList.contains("loading")).toBe(true);
    });

    it("calls onClick if provided", () => {
        const handleClick = vi.fn();

        const { getByAltText } = render(<ImageWithRetry src="test.jpg" onClick={handleClick} />);

        fireEvent.click(getByAltText("Chat image"));
        expect(handleClick).toHaveBeenCalled();
    });

    it("applies additional className", () => {
        const { getByAltText } = render(
            <ImageWithRetry src="test.jpg" className="custom-class" alt="Test" />,
        );

        const img = getByAltText("Test");
        expect(img).toHaveClass("custom-class");
    });

    it("renders with default alt text when not provided", () => {
        const { getByAltText } = render(<ImageWithRetry src="test.jpg" />);

        const img = getByAltText("Chat image");
        expect(img).toBeInTheDocument();
    });

    it("calls registerImage on mount", () => {
        render(<ImageWithRetry src="test.jpg" />);

        // registerImage should be called when component mounts
        expect(mockRegisterImage).toHaveBeenCalled();
    });

    it("passes correct parameters to registerImage", () => {
        const { getByAltText } = render(<ImageWithRetry src="https://example.com/test.jpg" alt="Test" />);

        const img = getByAltText("Test");

        // Check that registerImage was called with the image element and URL
        expect(mockRegisterImage).toHaveBeenCalledWith(img, "https://example.com/test.jpg");
    });

    it("handles image with loading class initially", () => {
        const { getByAltText } = render(<ImageWithRetry src="test.jpg" alt="Loading Test" />);

        const img = getByAltText("Loading Test");
        expect(img).toHaveClass("loading");
    });
});
