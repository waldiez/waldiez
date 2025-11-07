/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import DOMPurify from "dompurify";
import { Marked, Renderer, type Tokens } from "marked";
import { markedHighlight } from "marked-highlight";

import { type FC, useCallback, useMemo } from "react";

import { ALLOWED_ATTR, ALLOWED_TAGS, ALLOWED_URI_REGEXP } from "@waldiez/components/markdown/constants";
import hljs from "@waldiez/components/markdown/hljs";
import { extractText, preprocessContent } from "@waldiez/components/markdown/utils";

type MarkdownRendererProps = {
    content: any;
    isDarkMode?: boolean;
    className?: string;
    onImageClick?: (url: string) => void;
};
/**
 * Component to render markdown content
 */
export const Markdown: FC<MarkdownRendererProps> = ({ content, className, isDarkMode, onImageClick }) => {
    // CSS class to handle dark/light mode
    const themeClass = isDarkMode ? "markdown-dark" : "markdown-light";
    const rawStr = useMemo(() => extractText(content), [content]);
    const processedStr = useMemo(() => preprocessContent(rawStr), [rawStr]);
    const markedInstance = useMemo(() => {
        const instance = new Marked(
            markedHighlight({
                langPrefix: "hljs language-",
                highlight(code, lang) {
                    try {
                        if (lang && hljs.getLanguage(lang)) {
                            return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
                        }
                    } catch {}
                    return hljs.highlightAuto(code).value;
                },
            }),
        );
        const renderer = new Renderer();
        const esc = (s: string) => s.replace(/"/g, "&quot;");
        renderer.image = ({ href, title, text }: Tokens.Image) => {
            const src = href ?? "";
            const ttl = title ? ` title="${esc(title)}"` : "";
            const alt = text ? ` alt="${esc(text)}"` : "";
            return `<img class="markdown-image" src="${esc(src)}" data-src="${esc(src)}"${ttl}${alt} />`;
        };
        renderer.link = ({ href, title, tokens }: Tokens.Link) => {
            const h = href ?? "#";
            const t = title ? ` title="${esc(title)}"` : "";
            const text = renderer.parser.parseInline(tokens);
            return `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer"${t}>${text}</a>`;
        };
        instance.setOptions({
            gfm: true,
            breaks: false,
            pedantic: false,
            renderer,
        });
        return instance;
    }, []);
    const html = useMemo(() => {
        const cleaned = processedStr.replace(/<!--[\s\S]*?-->/g, "");
        const rawHtml = markedInstance.parse(cleaned, { async: false });
        return DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS,
            ALLOWED_ATTR,
            ALLOWED_URI_REGEXP,
            KEEP_CONTENT: true,
            RETURN_TRUSTED_TYPE: false,
        });
    }, [processedStr, markedInstance]);
    const onClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!onImageClick) {
                return;
            }
            const el = e.target as HTMLElement;
            if (el.classList.contains("markdown-image")) {
                const url = el.getAttribute("data-src");
                if (url) {
                    onImageClick(url);
                }
            }
        },
        [onImageClick],
    );
    return (
        <div
            className={`markdown-content ${themeClass} ${className ?? ""}`}
            data-testid="markdown-content"
            onClick={onClick}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

Markdown.displayName = "Markdown";
