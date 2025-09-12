/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";

type MarkdownRendererProps = {
    content: any;
    isDarkMode?: boolean;
    onImageClick?: (url: string) => void;
};

/**
 * Type guard to check if a React node is a valid element with props
 */
const isReactElementWithProps = (
    node: React.ReactNode,
): node is React.ReactElement<{ className?: string }> => {
    return React.isValidElement(node) && typeof node.props === "object" && node.props !== null;
};

/**
 * Extract language from className string
 */
const extractLanguageFromClassName = (className: string): string | null => {
    const match = /language-(\w+)/.exec(className);
    return match && match[1] !== "md" ? match[1] || null : null;
};

/**
 * Find language in React children recursively
 */
const findLanguageInChildren = (children: React.ReactNode): string | null => {
    if (isReactElementWithProps(children) && children.props.className) {
        return extractLanguageFromClassName(children.props.className);
    }

    if (Array.isArray(children)) {
        for (const child of children) {
            const language = findLanguageInChildren(child);
            if (language) {
                return language;
            }
        }
    }

    return null;
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

    if (!shouldRenderMarkdown) {
        return <span>{strContent}</span>;
    }

    // CSS class to handle dark/light mode
    const themeClass = isDarkMode ? "markdown-dark" : "markdown-light";

    // noinspection JSUnusedGlobalSymbols
    return (
        <div className={`markdown-renderer ${themeClass}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom rendering for links
                    a: ({ children, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" className="markdown-link">
                            {children}
                        </a>
                    ),

                    // Custom rendering for images with preview capability
                    img: ({ src, alt, ...props }) => (
                        <img
                            src={src}
                            alt={alt || "Image"}
                            className="chat-image markdown-image"
                            onClick={() => src && onImageClick && onImageClick(src)}
                            {...props}
                        />
                    ),

                    // Heading components
                    h1: ({ children, ...props }) => (
                        <h1 className="markdown-h1" {...props}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 className="markdown-h2" {...props}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 className="markdown-h3" {...props}>
                            {children}
                        </h3>
                    ),
                    h4: ({ children, ...props }) => (
                        <h4 className="markdown-h4" {...props}>
                            {children}
                        </h4>
                    ),
                    h5: ({ children, ...props }) => (
                        <h5 className="markdown-h5" {...props}>
                            {children}
                        </h5>
                    ),
                    h6: ({ children, ...props }) => (
                        <h6 className="markdown-h6" {...props}>
                            {children}
                        </h6>
                    ),

                    // List items
                    ul: ({ children, ...props }) => (
                        <ul className="markdown-ul" {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol className="markdown-ol" {...props}>
                            {children}
                        </ol>
                    ),
                    li: ({ children, ...props }) => (
                        <li className="markdown-li" {...props}>
                            {children}
                        </li>
                    ),

                    // Block elements
                    blockquote: ({ children, ...props }) => (
                        <blockquote className="markdown-blockquote" {...props}>
                            {children}
                        </blockquote>
                    ),

                    // Table components
                    table: ({ children, ...props }) => (
                        <table className="markdown-table" {...props}>
                            {children}
                        </table>
                    ),
                    thead: ({ children, ...props }) => (
                        <thead className="markdown-thead" {...props}>
                            {children}
                        </thead>
                    ),
                    tbody: ({ children, ...props }) => (
                        <tbody className="markdown-tbody" {...props}>
                            {children}
                        </tbody>
                    ),
                    tr: ({ children, ...props }) => (
                        <tr className="markdown-tr" {...props}>
                            {children}
                        </tr>
                    ),
                    th: ({ children, ...props }) => (
                        <th className="markdown-th" {...props}>
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td className="markdown-td" {...props}>
                            {children}
                        </td>
                    ),

                    // Custom code block rendering
                    code: ({ children, className, ...props }) => {
                        // Check if this is a block code (inside a pre) or inline code
                        const isInline = !className;

                        if (isInline) {
                            return (
                                <code className="markdown-inline-code" {...props}>
                                    {children}
                                </code>
                            );
                        }

                        // For code blocks, just return the code and let the pre component handle the wrapper
                        return (
                            <code className={`markdown-code ${className || ""}`} {...props}>
                                {children}
                            </code>
                        );
                    },

                    // Pre tag wrapper for code blocks
                    pre: ({ children, ...props }) => {
                        // Extract language information from the code block if available
                        const language = findLanguageInChildren(children);

                        // If we found a language, show it in the header
                        if (language) {
                            return (
                                <div className="markdown-code-block-wrapper">
                                    <div className="markdown-code-block-header">
                                        <span className="markdown-code-language">{language}</span>
                                    </div>
                                    <pre className="markdown-pre" {...props}>
                                        {children}
                                    </pre>
                                </div>
                            );
                        }

                        // Otherwise, just render a normal pre block
                        return (
                            <pre className="markdown-pre" {...props}>
                                {children}
                            </pre>
                        );
                    },

                    // Paragraph
                    p: ({ children, ...props }) => (
                        <p className="markdown-p" {...props}>
                            {children}
                        </p>
                    ),

                    // Horizontal rule
                    hr: props => <hr className="markdown-hr" {...props} />,
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

Markdown.displayName = "Markdown";
