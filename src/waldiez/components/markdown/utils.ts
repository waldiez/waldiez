/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements,complexity */
const MAX_JSON_FALLBACK = 8_000;

export const extractText = (obj: any): string => {
    if (obj === null) {
        return "";
    }
    if (typeof obj === "string") {
        return obj;
    }
    if (typeof obj === "number") {
        return String(obj);
    }

    if (typeof obj === "boolean") {
        return String(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(extractText).filter(Boolean).join("\n\n");
    }

    if (typeof obj === "object") {
        // Common LLM-ish shapes
        if (typeof (obj as any).text === "string") {
            return (obj as any).text;
        }
        if (typeof (obj as any).prompt === "string") {
            return (obj as any).prompt;
        }
        if (Array.isArray((obj as any).content)) {
            return extractText((obj as any).content);
        }

        if (typeof (obj as any).type === "string") {
            const entry = (obj as any)[(obj as any).type];
            if (entry !== undefined) {
                return extractText(entry);
            }
        }

        for (const key of ["message", "value", "data", "content"]) {
            const v = (obj as any)[key];
            if (typeof v === "string") {
                return v;
            }
            if (Array.isArray(v) || (v && typeof v === "object")) {
                const s = extractText(v);
                if (s) {
                    return s;
                }
            }
        }
    }

    try {
        const json = JSON.stringify(obj, null, 2) ?? "";
        const clipped =
            json.length > MAX_JSON_FALLBACK ? json.slice(0, MAX_JSON_FALLBACK) + "\n…(truncated)" : json;
        return "```json\n" + clipped + "\n```";
    } catch {
        return "";
    }
};

export const preprocessContent = (content: string): string => {
    let processed = content;
    const mdFence = /^```(?:md|markdown|mdown)\r?\n([\s\S]*?)\r?\n```$/gm;
    processed = processed.replace(mdFence, (_m, inner) => inner);
    const anyFence = /^```([a-zA-Z0-9+-]*)\r?\n([\s\S]*?)\r?\n```$/gm;
    processed = processed.replace(anyFence, (_m, lang, code) => {
        const language = (lang || "").trim();
        if (language && !/^md(?:own)?|markdown$/i.test(language)) {
            return "```" + language + "\n" + code + "\n```";
        }
        return "```\n" + code + "\n```";
    });

    return processed;
};
