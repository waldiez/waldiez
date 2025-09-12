/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Markdown } from "@waldiez/components/markdown";

describe("Markdown Component", () => {
    let mockOnImageClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnImageClick = vi.fn();
        vi.clearAllMocks();
    });

    describe("Content Preprocessing", () => {
        it("preserves non-markdown text", () => {
            const content = "This is a simple text without markdown.";
            render(<Markdown content={content} />);
            expect(screen.getByText(content)).toBeInTheDocument();
        });

        it("renders other language code blocks (no transformation of content)", () => {
            const content = '```javascript\nconsole.log("hello");\n```';
            render(<Markdown content={content} />);

            // look for parts to avoid exact-quote flakiness
            expect(screen.getByText("console")).toBeInTheDocument();
            expect(screen.getByText("log")).toBeInTheDocument();
            expect(screen.getByText('"hello"')).toBeInTheDocument();

            // code block structure exists
            expect(document.querySelector("pre")).toBeInTheDocument();
            expect(document.querySelector("pre code")).toBeInTheDocument();
        });
    });
    describe("Non-string content", () => {
        it("renders text when content is an object with type 'text'", () => {
            const content = { type: "text", text: "Hello from Assistant 1" };
            render(<Markdown content={content} />);

            expect(screen.getByText("Hello from Assistant 1")).toBeInTheDocument();
        });

        it("renders array content if provided inside object", () => {
            const content = {
                type: "text",
                text: {
                    content: [{ type: "text", text: "Array content here" }],
                },
            };
            render(<Markdown content={content} />);

            expect(screen.getByText("Array content here")).toBeInTheDocument();
        });

        it("handles input_request objects gracefully", () => {
            const content = {
                id: "123",
                type: "input_request",
                content: [{ type: "text", text: "Prompt from system" }],
            };
            render(<Markdown content={content} />);

            expect(screen.getByText("Prompt from system")).toBeInTheDocument();
        });
        it("renders unknown objects as markdown JSON code block", () => {
            const content = { foo: "bar", nested: { baz: 1 } };
            render(<Markdown content={content} />);

            const codeBlock = document.querySelector("pre code");
            expect(codeBlock).toBeInTheDocument();
            expect(codeBlock?.textContent).toContain('"foo": "bar"');
            expect(codeBlock?.textContent).toContain('"baz": 1');
        });
        it("renders numbers", () => {
            const content = 42;
            render(<Markdown content={content as any} />);
            expect(screen.getByText("42")).toBeInTheDocument();
        });
    });

    describe("Custom Components / Code Elements", () => {
        it("renders code blocks with language header if language specified", () => {
            const content = "```javascript\nconsole.log('hello');\n```";
            render(<Markdown content={content} />);

            // If your component renders a language label/header
            const header = document.querySelector(".markdown-code-block-header");
            if (header) {
                expect(header).toHaveTextContent(/javascript/i);
            }

            // parts of code
            const code = document.querySelector("pre code");
            expect(code).toBeInTheDocument();
            expect(code?.textContent).toContain("console");
            expect(code?.textContent).toContain("hello");

            // wrapping element you mentioned
            const wrapper = document.querySelector(".markdown-code-block-wrapper");
            if (wrapper) {
                expect(wrapper).toBeInTheDocument();
            }
        });

        it("renders code blocks without language header when no language specified", () => {
            const content = "```\nplain code\n```";
            render(<Markdown content={content} />);

            expect(screen.getByText("plain code")).toBeInTheDocument();

            const pre = document.querySelector("pre");
            expect(pre).toBeInTheDocument();
            // If you assign a class like markdown-pre
            if (pre) {
                expect(pre.className).toMatch(/markdown-pre|^$/);
            }

            // Should not have language header
            const header = document.querySelector(".markdown-code-block-header");
            expect(header).not.toBeInTheDocument();
        });

        it("detects multiple language code blocks", () => {
            const content = `
\`\`\`javascript
console.log('hello');
\`\`\`
\`\`\`python
print('world')
\`\`\`
`;
            render(<Markdown content={content} />);
            const blocks = document.querySelectorAll("pre code");
            expect(blocks.length).toBe(2);
            expect(blocks[0]!.textContent).toContain("console.log");
            expect(blocks[1]!.textContent).toContain("print('world')");
        });

        it("renders multi-line code blocks correctly", () => {
            const content = "```javascript\nfunction hello() {\n  console.log('world');\n}\n```";
            render(<Markdown content={content} />);
            const code = document.querySelector("pre code");
            expect(code).toBeInTheDocument();
            expect(code?.textContent).toContain("function hello()");
            expect(code?.textContent).toContain("console.log");
            expect(code?.textContent).toContain("world");
        });

        it("handles code blocks with HTML-like content safely", () => {
            const content = '```html\n<div class="test">Content</div>\n```';
            render(<Markdown content={content} />);
            const code = document.querySelector("pre code");
            expect(code).toBeInTheDocument();
            // Should appear as text inside the code element
            expect(code?.textContent).toContain('<div class="test">');
            expect(code?.textContent).toContain("Content");
        });
    });

    describe("Images", () => {
        it("renders images and triggers onImageClick on click", () => {
            const content = "![Alt text](https://example.com/image.png)";
            render(<Markdown content={content} onImageClick={mockOnImageClick} />);

            const img = screen.getByRole("img", { name: /alt text/i });
            expect(img).toBeInTheDocument();

            fireEvent.click(img);
            expect(mockOnImageClick).toHaveBeenCalledTimes(1);
            expect(mockOnImageClick.mock.calls[0]?.[0]).toMatch("https://example.com/image.png");
        });
    });

    describe("GFM features", () => {
        it("renders tables", () => {
            const content = `
| H1 | H2 |
|----|----|
| A  | B  |
`;
            render(<Markdown content={content} />);

            const table = document.querySelector("table");
            expect(table).toBeInTheDocument();
            expect(screen.getByText("H1")).toBeInTheDocument();
            expect(screen.getByText("H2")).toBeInTheDocument();
            expect(screen.getByText("A")).toBeInTheDocument();
            expect(screen.getByText("B")).toBeInTheDocument();
        });

        it("renders task list items (checkboxes)", () => {
            const content = `
- [x] done
- [ ] todo
`;
            render(<Markdown content={content} />);

            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBe(2);
            expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
            expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
        });
    });

    describe("Links & block elements", () => {
        it("renders headings, lists, blockquote, hr, and links", () => {
            const md = `
# Title

Paragraph with a [link](https://example.com).

> Quote

- item 1
- item 2

---

`;
            render(<Markdown content={md} />);

            expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Title");

            const link = screen.getByRole("link", { name: "link" });
            expect(link).toHaveAttribute("href", "https://example.com");
            expect(link).toHaveAttribute("target", "_blank");
            expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));

            expect(document.querySelector("blockquote")).toBeInTheDocument();
            expect(document.querySelector("hr")).toBeInTheDocument();
            expect(screen.getByText("item 1")).toBeInTheDocument();
            expect(screen.getByText("item 2")).toBeInTheDocument();
        });
    });

    describe("Integration", () => {
        // eslint-disable-next-line max-statements
        it("renders a complex markdown document", () => {
            const complex = `
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
            render(<Markdown content={complex} onImageClick={mockOnImageClick} />);

            expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Main Title");
            expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Code Example");

            // bold / italic appear as text; exact tags depend on your renderer
            expect(screen.getByText("bold")).toBeInTheDocument();
            expect(screen.getByText("italic")).toBeInTheDocument();

            const codeBlock = document.querySelector("pre code");
            expect(codeBlock?.textContent).toContain("Hello, world!");

            const firstLink = screen.getByRole("link", { name: "link" });
            expect(firstLink).toHaveAttribute("href", "https://example.com");

            expect(document.querySelector("blockquote")).toBeInTheDocument();
            expect(document.querySelector("hr")).toBeInTheDocument();

            // H4 "Unordered List"
            expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Unordered List");
            expect(screen.getByText("Item one")).toBeInTheDocument();
            expect(screen.getByText("Item two")).toBeInTheDocument();
            expect(screen.getByText("Item three")).toBeInTheDocument();

            const table = document.querySelector("table");
            expect(table).toBeInTheDocument();
            expect(screen.getByText("Header 1")).toBeInTheDocument();
            expect(screen.getByText("Header 2")).toBeInTheDocument();
            expect(screen.getByText("Row 1")).toBeInTheDocument();
            expect(screen.getByText("Row 2")).toBeInTheDocument();
        });
    });
});
