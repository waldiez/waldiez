/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "@waldiez/components/markdown/main";

describe("Markdown", () => {
    it("renders markdown content", () => {
        render(<Markdown content="# Hello World" />);

        expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        const { container } = render(<Markdown content="test" className="custom-class" />);

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveClass("custom-class");
    });

    it("renders headings", () => {
        render(<Markdown content="# Heading" />);

        const content = screen.getByTestId("markdown-content");
        const heading = content.querySelector("h1");

        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent("Heading");
    });

    it("renders strong/bold text", () => {
        render(<Markdown content="**bold**" />);

        const content = screen.getByTestId("markdown-content");
        const strong = content.querySelector("strong");

        expect(strong).toBeInTheDocument();
        expect(strong).toHaveTextContent("bold");
    });

    it("renders blockquote", () => {
        render(<Markdown content="> quote" />);

        const content = screen.getByTestId("markdown-content");
        const blockquote = content.querySelector("blockquote");

        expect(blockquote).toBeInTheDocument();
        expect(blockquote?.textContent).toContain("quote");
    });

    it("renders links", () => {
        render(<Markdown content="[link](https://example.com)" />);

        const content = screen.getByTestId("markdown-content");
        const link = content.querySelector("a");

        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "https://example.com");
        expect(link).toHaveTextContent("link");
    });

    it("sanitizes dangerous links", () => {
        render(<Markdown content="[evil](javascript:alert('xss'))" />);

        const content = screen.getByTestId("markdown-content");
        const link = content.querySelector("a");

        // DOMPurify keeps the <a> tag but removes dangerous href
        expect(link).toBeInTheDocument();
        expect(link?.getAttribute("href")).toBeNull();
        expect(link?.textContent).toBe("evil");
    });

    it("handles empty source", () => {
        render(<Markdown content="" />);

        expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
        expect(screen.getByTestId("markdown-content").innerHTML).toBe("");
    });

    it("handles complex markdown", () => {
        const complexMarkdown = `
# Main Title
## Subtitle
- List item 1
- List item 2
\`\`\`python
print("code block")
\`\`\`
        `;

        render(<Markdown content={complexMarkdown} />);

        const content = screen.getByTestId("markdown-content");
        expect(content.textContent).toContain("Main Title");
        expect(content.textContent).toContain("Subtitle");
        expect(content.textContent).toContain("List item 1");
        expect(content.textContent).toContain('print("code block")');
    });

    it("renders different heading levels", () => {
        const { rerender } = render(<Markdown content="# H1" />);
        expect(screen.getByTestId("markdown-content").querySelector("h1")).toBeInTheDocument();

        rerender(<Markdown content="## H2" />);
        expect(screen.getByTestId("markdown-content").querySelector("h2")).toBeInTheDocument();

        rerender(<Markdown content="### H3" />);
        expect(screen.getByTestId("markdown-content").querySelector("h3")).toBeInTheDocument();

        rerender(<Markdown content="#### H4" />);
        expect(screen.getByTestId("markdown-content").querySelector("h4")).toBeInTheDocument();
    });

    it("handles special characters", () => {
        const specialMarkdown = '# Title with & < > " characters';

        render(<Markdown content={specialMarkdown} />);

        const content = screen.getByTestId("markdown-content");
        expect(content.textContent).toContain('Title with & < > " characters');
    });

    it("removes HTML comments", () => {
        const markdownWithComments = `
<!-- This is a comment -->
# Title
<!-- Another comment -->
Content
        `;

        render(<Markdown content={markdownWithComments} />);

        const content = screen.getByTestId("markdown-content");
        expect(content.innerHTML).not.toContain("<!-- This is a comment -->");
        expect(content.innerHTML).not.toContain("<!-- Another comment -->");
        expect(content.textContent).toContain("Title");
        expect(content.textContent).toContain("Content");
    });

    it("handles lists", () => {
        const listMarkdown = `
- Item 1
- Item 2

1. First
2. Second
        `;

        render(<Markdown content={listMarkdown} />);

        const content = screen.getByTestId("markdown-content");

        const uls = content.querySelectorAll("ul");
        expect(uls.length).toBeGreaterThanOrEqual(1);
        const ulItems = uls[0]!.querySelectorAll("li");
        expect(ulItems.length).toBe(2);
        expect(ulItems[0]!.textContent).toContain("Item 1");
        expect(ulItems[1]!.textContent).toContain("Item 2");

        const ols = content.querySelectorAll("ol");
        expect(ols.length).toBeGreaterThanOrEqual(1);
        const olItems = ols[0]!.querySelectorAll("li");
        expect(olItems.length).toBe(2);
        expect(olItems[0]!.textContent).toContain("First");
        expect(olItems[1]!.textContent).toContain("Second");
    });

    it("handles tables", () => {
        const tableMarkdown = `
| Name  | Age |
|-------|-----|
| Alice | 30  |
| Bob   | 25  |
        `;

        render(<Markdown content={tableMarkdown} />);

        const content = screen.getByTestId("markdown-content");

        const table = content.querySelector("table");
        expect(table).toBeInTheDocument();

        const headerCells = Array.from(content.querySelectorAll("thead th")).map(el =>
            el.textContent?.trim(),
        );
        expect(headerCells).toEqual(["Name", "Age"]);

        const rows = content.querySelectorAll("tbody tr");
        expect(rows.length).toBe(2);

        const row1Cells = rows[0]!.querySelectorAll("td");
        const row2Cells = rows[1]!.querySelectorAll("td");

        expect(row1Cells[0]!.textContent).toContain("Alice");
        expect(row1Cells[1]!.textContent).toContain("30");
        expect(row2Cells[0]!.textContent).toContain("Bob");
        expect(row2Cells[1]!.textContent).toContain("25");
    });

    it("handles code blocks", () => {
        const codeMarkdown = "```javascript\nconst x = 42;\n```";

        render(<Markdown content={codeMarkdown} />);

        const content = screen.getByTestId("markdown-content");
        const pre = content.querySelector("pre");
        const code = content.querySelector("code");

        expect(pre).toBeInTheDocument();
        expect(code).toBeInTheDocument();
        expect(code?.textContent).toContain("const x = 42;");
    });

    it("handles inline code", () => {
        render(<Markdown content="This is `inline code` here" />);

        const content = screen.getByTestId("markdown-content");
        const code = content.querySelector("code");

        expect(code).toBeInTheDocument();
        expect(code?.textContent).toBe("inline code");
    });

    it("sanitizes script tags", () => {
        const maliciousMarkdown = '<script>alert("xss")</script>\n# Safe content';

        render(<Markdown content={maliciousMarkdown} />);

        const content = screen.getByTestId("markdown-content");

        // DOMPurify should remove script tags
        expect(content.querySelector("script")).toBeNull();
        expect(content.innerHTML).not.toContain("<script>");
        expect(content.textContent).toContain("Safe content");
    });

    it("sanitizes onclick attributes", () => {
        const maliciousMarkdown = '<a href="#" onclick="alert(\'xss\')">Click me</a>';

        render(<Markdown content={maliciousMarkdown} />);

        const content = screen.getByTestId("markdown-content");
        const link = content.querySelector("a");

        // DOMPurify should remove onclick attribute
        if (link) {
            expect(link.getAttribute("onclick")).toBeNull();
        }
    });

    it("preserves safe HTML", () => {
        const safeHtml = '<div class="custom">Safe <strong>HTML</strong></div>';

        render(<Markdown content={safeHtml} />);

        const content = screen.getByTestId("markdown-content");
        const div = content.querySelector("div.custom");
        const strong = content.querySelector("strong");

        expect(div).toBeInTheDocument();
        expect(strong).toBeInTheDocument();
        expect(strong?.textContent).toBe("HTML");
    });
});
