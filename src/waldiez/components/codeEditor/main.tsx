/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { editor } from "monaco-editor";

import { type FC, useCallback, useRef } from "react";

import { Editor } from "@monaco-editor/react";

type NavigatorWithUAData = Navigator & {
    userAgentData?: {
        brands?: { brand: string; version: string }[];
    };
};

// eslint-disable-next-line max-statements
const isChromiumBased = (): boolean => {
    if (typeof navigator === "undefined") {
        return false;
    }
    const nav = navigator as NavigatorWithUAData;
    if (nav.userAgentData?.brands?.length) {
        const isChromiumBrand = nav.userAgentData.brands.some(br =>
            /Chromium|Google Chrome|Microsoft Edge/i.test(br.brand),
        );
        if (isChromiumBrand) {
            return true;
        }
        return false;
    }

    // Fallback
    const ua = nav.userAgent;
    const isiOS = /iP(ad|hone|od)/i.test(ua);
    if (isiOS) {
        return false;
    }
    if (/Firefox|FxiOS/i.test(ua)) {
        return false;
    }
    const isWebKit = /Safari/i.test(ua) && !/Chrome|Chromium|CrMo|CriOS/i.test(ua);
    if (isWebKit) {
        return false;
    }
    return /Chrome|Chromium|Edg|OPR|Brave|Vivaldi|YaBrowser/i.test(ua);
};

export const CodeEditor: FC<{
    value: string;
    onChange: (value: string | undefined) => void;
    darkMode: boolean;
}> = (props: { value: string; onChange: (value: string | undefined) => void; darkMode: boolean }) => {
    const { value, onChange, darkMode } = props;
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
        editor.onKeyDown(e => {
            if (!isChromiumBased()) {
                return;
            }
            if (e.keyCode === 10 && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();

                const position = editor.getPosition();
                const model = editor.getModel();
                if (position && model) {
                    editor.executeEdits("keyboard", [
                        {
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column,
                            },
                            text: " ",
                            forceMoveMarkers: true,
                        },
                    ]);
                }
            }
        });
    }, []);

    const theme = darkMode ? "vs-dark" : "vs-light";

    return (
        <div className="code-editor">
            <Editor
                defaultLanguage="python"
                language="python"
                // cspell: disable-next-line
                path="inmemory://file.py"
                theme={theme}
                value={value}
                className={theme}
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    wordWrap: "on",
                    automaticLayout: true,
                    fontSize: 13,
                    fontLigatures: true,
                    formatOnType: true,
                    renderWhitespace: "selection",
                    smoothScrolling: true,
                    autoClosingBrackets: "always",
                    tabSize: 4,
                    minimap: { enabled: false },
                    cursorBlinking: "smooth",
                }}
            />
        </div>
    );
};

CodeEditor.displayName = "CodeEditor";
