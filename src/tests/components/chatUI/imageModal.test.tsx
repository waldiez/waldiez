/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageModal } from "@waldiez/components/chatUI/imageModal";

describe("ImageModal", () => {
    const url = "https://img.com/foo.jpg";

    it("renders when open and displays image", () => {
        const { getByAltText } = render(<ImageModal isOpen imageUrl={url} onClose={vi.fn()} />);
        expect(getByAltText("Fullscreen preview")).toHaveAttribute("src", url);
    });

    it("does not render when not open", () => {
        const { queryByAltText } = render(<ImageModal isOpen={false} imageUrl={url} onClose={vi.fn()} />);
        expect(queryByAltText("Fullscreen preview")).toBeNull();
    });

    it("calls onClose when overlay is clicked", () => {
        const onClose = vi.fn();
        const { getByTestId } = render(<ImageModal isOpen imageUrl={url} onClose={onClose} />);
        fireEvent.click(getByTestId("modal-overlay"));
        expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when close button is clicked", () => {
        const onClose = vi.fn();
        const { getByTestId } = render(<ImageModal isOpen imageUrl={url} onClose={onClose} />);
        fireEvent.click(getByTestId("modal-close"));
        expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when Escape key is pressed", () => {
        const onClose = vi.fn();
        render(<ImageModal isOpen imageUrl={url} onClose={onClose} />);
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalled();
    });
});
