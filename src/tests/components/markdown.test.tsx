/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Markdown } from "@waldiez/components/markdown";

describe("Markdown Component", () => {
    let mockOnImageClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnImageClick = vi.fn();
        vi.clearAllMocks();
    });

    describe("Content Preprocessing", () => {
        it("should preserve other language code blocks", () => {
            const content = '```javascript\nconsole.log("hello");\n```';
            render(<Markdown content={content} />);

            // Instead of looking for the exact string, look for parts of it
            expect(screen.getByText("console")).toBeInTheDocument();
            expect(screen.getByText("log")).toBeInTheDocument();
            expect(screen.getByText('"hello"')).toBeInTheDocument();

            // Or check that the code block structure exists
            expect(document.querySelector("pre")).toBeInTheDocument();
            expect(document.querySelector("code")).toBeInTheDocument();
        });
        it("should skip merkdown processing if not needed", () => {
            const content = "This is a simple text without markdown.";
            render(<Markdown content={content} />);

            // Check that the text is rendered as is
            expect(screen.getByText("This is a simple text without markdown.")).toBeInTheDocument();
        });
    });

    describe("Custom Components", () => {
        describe("Code Elements", () => {
            it("should render code blocks with language header", () => {
                const content = "```javascript\nconsole.log('hello');\n```";
                render(<Markdown content={content} />);

                expect(screen.getByText("javascript")).toBeInTheDocument();

                // Check for parts of the code instead of the whole string
                expect(screen.getByText("console")).toBeInTheDocument();
                expect(screen.getByText("log")).toBeInTheDocument();
                expect(screen.getByText("'hello'")).toBeInTheDocument();

                const wrapper = document.querySelector(".markdown-code-block-wrapper");
                expect(wrapper).toBeInTheDocument();

                const header = document.querySelector(".markdown-code-block-header");
                expect(header).toBeInTheDocument();
            });

            it("should render code blocks without language header when no language specified", () => {
                const content = "```\nplain code\n```";
                render(<Markdown content={content} />);

                // Plain code without language shouldn't be syntax highlighted
                expect(screen.getByText("plain code")).toBeInTheDocument();

                const pre = document.querySelector("pre");
                expect(pre).toHaveClass("markdown-pre");

                // Should not have language header
                const header = document.querySelector(".markdown-code-block-header");
                expect(header).not.toBeInTheDocument();
            });

            it("should detect multiple language code blocks", () => {
                const content = `
\`\`\`javascript
console.log('hello');
\`\`\`
\`\`\`python
print('world')
\`\`\``;
                render(<Markdown content={content} />);
                const codeBlocks = document.querySelectorAll("pre code");
                expect(codeBlocks.length).toBe(2);
                expect(codeBlocks[0].textContent).toContain("console.log");
                expect(codeBlocks[1].textContent).toContain("print('world')");
            });

            // Test with more complex code
            it("should render multi-line code blocks correctly", () => {
                const content = "```javascript\nfunction hello() {\n    console.log('world');\n}\n```";
                render(<Markdown content={content} />);

                const codeBlock = document.querySelector("pre code");
                expect(codeBlock).toBeInTheDocument();

                // Check that the full code is there as text content
                expect(codeBlock?.textContent).toContain("function hello()");
                expect(codeBlock?.textContent).toContain("console.log");
                expect(codeBlock?.textContent).toContain("world");
            });

            // Test syntax highlighting classes are applied
            it("should apply syntax highlighting classes", () => {
                const content = "```javascript\nconsole.log('hello');\n```";
                render(<Markdown content={content} />);

                // Check that highlight.js classes are present
                const highlightedElements = document.querySelectorAll('[class*="hljs"]');
                expect(highlightedElements.length).toBeGreaterThan(0);
            });
            it("should handle code blocks with HTML-like content", () => {
                const content = '```html\n<div class="test">Content</div>\n```';
                render(<Markdown content={content} />);

                const codeBlock = document.querySelector("pre code");
                expect(codeBlock?.textContent).toContain('<div class="test">');
                expect(codeBlock?.textContent).toContain("Content");
            });
        });
    });

    describe("Integration Tests", () => {
        it("should render complex markdown document correctly", () => {
            const complexMarkdown = `
# Main Title

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
function hello() {
    console.log("Hello, world!");
}
\`\`\`

### List of Items

1. First item
2. Second item with [link](https://example.com)
3. Third item

> This is a blockquote with important information.

---

This is a horizontal rule.


#### Unordered List

- Item one
- Item two
- Item three

##### Sub-subheading

###### Sub-sub-subheading

###### Table Example

| Header 1 | Header 2 |
|----------|----------|
| Row 1    | Row 2    |
| Row 3    | Row 4    |
| Row 5    | Row 6    |

Final paragraph with inline \`code\`.
            `;

            render(<Markdown content={complexMarkdown} onImageClick={mockOnImageClick} />);

            // Check various elements are rendered
            expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Main Title");
            expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Code Example");
            expect(screen.getByText("bold")).toBeInTheDocument();
            expect(screen.getByText("italic")).toBeInTheDocument();

            // For code, check parts or the container
            const codeBlock = document.querySelector("pre code");
            expect(codeBlock?.textContent).toContain("Hello, world!");

            expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.com");
            expect(document.querySelector("blockquote")).toBeInTheDocument();
            expect(document.querySelector("hr")).toBeInTheDocument();
            expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Unordered List");
            expect(screen.getByText("Item one")).toBeInTheDocument();
            expect(screen.getByText("Item two")).toBeInTheDocument();
            expect(screen.getByText("Item three")).toBeInTheDocument();
            expect(document.querySelector("table")).toBeInTheDocument();
            expect(screen.getByText("Header 1")).toBeInTheDocument();
            expect(screen.getByText("Header 2")).toBeInTheDocument();
            expect(screen.getByText("Row 1")).toBeInTheDocument();
            expect(screen.getByText("Row 2")).toBeInTheDocument();
        });
    });
});
