/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import hljs from "highlight.js";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import Renderer from "marked-react";

import React, { type JSX, useMemo } from "react";

type MarkdownRendererProps = {
    content: any;
    isDarkMode?: boolean;
    onImageClick?: (url: string) => void;
};

/**
 * Detects if text might contain markdown syntax
 * @param text - The text to check
 * @returns boolean - True if the text might be markdown, false otherwise
 */
const mightBeMarkdown = (text: string): boolean => {
    // noinspection RegExpRedundantEscape
    const markdownPatterns = [
        /\*\*(.*?)\*\*/, // Bold
        /__(.*?)__/, // Bold
        /\[(.*?)\]\((.*?)\)/, // Links
        /```([\s\S]*?)```/, // Code blocks
        /#+\s+.*/, // Headers
        />\s+.*/, // Blockquotes
        /\d+\.\s+.*/, // Ordered lists
        /[\*\-\+]\s+.*/, // Unordered lists
        /\|(.*?)\|/, // Tables
        /!\[(.*?)\]\((.*?)\)/, // Images
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
};

/**
 * Pre-processes content to handle special cases
 */
const preprocessContent = (content: string): string => {
    // Special handling for code blocks with language indicators
    // If a code block has "md" language indicator, we should render its content as markdown
    let processedContent = content;

    // Detect and process ```md code blocks - render their content as markdown
    const mdCodeBlockRegex = /```md\n([\s\S]*?)```/g;
    processedContent = processedContent.replace(mdCodeBlockRegex, (_match, codeContent) => {
        // Just return the inner content without the ```md wrapper
        return codeContent;
    });

    // For other code blocks, ensure they have proper formatting
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    processedContent = processedContent.replace(codeBlockRegex, (_match, language, codeContent) => {
        // If it's a language indicator we want to preserve, keep it
        if (language && language !== "md") {
            return `\`\`\`${language}\n${codeContent}\`\`\``;
        }
        // Otherwise, just use a generic code block
        return `\`\`\`\n${codeContent}\`\`\``;
    });

    return processedContent;
};

// eslint-disable-next-line max-statements
const extractText = (obj: any): string => {
    if (!obj) {
        return "";
    }
    if (typeof obj === "string") {
        return obj;
    }
    if (typeof obj === "number") {
        return obj.toString();
    }
    // arrays: flatten
    if (Array.isArray(obj)) {
        return obj.map(extractText).filter(Boolean).join("");
    }

    // objects
    if (typeof obj === "object") {
        // common shapes
        if (typeof obj.text === "string") {
            return obj.text;
        }
        if (typeof obj.prompt === "string") {
            return obj.prompt;
        }

        // content blocks array
        if (Array.isArray(obj.content)) {
            return extractText(obj.content);
        }

        // shape: { type: "text", text: "..."} already handled; but also { type, [type]: ... }
        if (typeof obj.type === "string") {
            const entry = (obj as any)[obj.type];
            if (entry !== undefined) {
                return extractText(entry);
            }
        }

        // last resort: try a few common keys
        for (const key of ["message", "value", "data", "content"]) {
            if (typeof obj[key] === "string") {
                return obj[key];
            }
            if (Array.isArray(obj[key]) || typeof obj[key] === "object") {
                const s = extractText(obj[key]);
                if (s) {
                    return s;
                }
            }
        }
    }

    // ultimate fallback
    try {
        return "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
    } catch {
        return "";
    }
};

/**
 * Component to render markdown content
 */
export const Markdown: React.FC<MarkdownRendererProps> = ({ content, isDarkMode = false, onImageClick }) => {
    const strContent = useMemo(() => extractText(content), [content]);

    // Skip markdown processing for short texts or if it doesn't look like markdown
    const shouldRenderMarkdown = useMemo(() => {
        return strContent.length > 5 && mightBeMarkdown(strContent);
    }, [strContent]);

    // Pre-process content to handle special cases
    const processedContent = useMemo(() => {
        return preprocessContent(strContent);
    }, [strContent]);

    // Configure marked with extensions
    const markedInstance = useMemo(() => {
        const instance = new Marked(
            markedHighlight({
                langPrefix: "hljs language-",
                highlight(code, lang) {
                    const language = hljs.getLanguage(lang) ? lang : "plaintext";
                    return hljs.highlight(code, { language }).value;
                },
            }),
        );

        // Configure marked options
        instance.setOptions({
            gfm: true,
            breaks: false,
            pedantic: false,
        });

        return instance;
    }, []);

    // Custom renderer components
    const renderer = useMemo(
        () => ({
            // Custom rendering for links
            link: (children: React.ReactNode, href?: string) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                    {children}
                </a>
            ),

            // Custom rendering for images with preview capability
            image: (alt: string, src?: string) => (
                <img
                    src={src}
                    alt={alt || "Image"}
                    className="chat-image markdown-image"
                    onClick={() => src && onImageClick && onImageClick(src)}
                />
            ),

            // Heading components
            heading: (children: React.ReactNode, level: 1 | 2 | 3 | 4 | 5 | 6) => {
                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
                return <HeadingTag className={`markdown-h${level}`}>{children}</HeadingTag>;
            },

            // List components
            list: (children: React.ReactNode, ordered: boolean) => {
                const ListTag = ordered ? "ol" : "ul";
                const className = ordered ? "markdown-ol" : "markdown-ul";
                return <ListTag className={className}>{children}</ListTag>;
            },

            listitem: (children: React.ReactNode) => <li className="markdown-li">{children}</li>,

            // Block elements
            blockquote: (children: React.ReactNode) => (
                <blockquote className="markdown-blockquote">{children}</blockquote>
            ),

            // Table components
            table: (children: React.ReactNode) => <table className="markdown-table">{children}</table>,
            thead: (children: React.ReactNode) => <thead className="markdown-thead">{children}</thead>,
            tbody: (children: React.ReactNode) => <tbody className="markdown-tbody">{children}</tbody>,
            tablerow: (children: React.ReactNode) => <tr className="markdown-tr">{children}</tr>,
            tablecell: (children: React.ReactNode, header: boolean) => {
                const CellTag = header ? "th" : "td";
                const className = header ? "markdown-th" : "markdown-td";
                return <CellTag className={className}>{children}</CellTag>;
            },

            // Code components
            codespan: (children: React.ReactNode) => <code className="markdown-inline-code">{children}</code>,

            code: (children: React.ReactNode, lang?: string) => {
                if (lang) {
                    return (
                        <div className="markdown-code-block-wrapper">
                            <div className="markdown-code-block-header">
                                <span className="markdown-code-language">{lang}</span>
                            </div>
                            <pre className="markdown-pre">
                                <code className={`markdown-code hljs language-${lang}`}>{children}</code>
                            </pre>
                        </div>
                    );
                }

                return (
                    <pre className="markdown-pre">
                        <code className="markdown-code">{children}</code>
                    </pre>
                );
            },

            // Paragraph
            paragraph: (children: React.ReactNode) => <p className="markdown-p">{children}</p>,

            // Horizontal rule
            hr: () => <hr className="markdown-hr" />,
        }),
        [onImageClick],
    );

    if (!shouldRenderMarkdown) {
        return <span>{strContent}</span>;
    }

    // CSS class to handle dark/light mode
    const themeClass = isDarkMode ? "markdown-dark" : "markdown-light";

    return (
        <div className={`markdown-renderer ${themeClass}`}>
            <Renderer value={processedContent} gfm breaks renderer={renderer} instance={markedInstance} />
        </div>
    );
};

Markdown.displayName = "Markdown";
