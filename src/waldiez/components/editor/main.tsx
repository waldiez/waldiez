/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

import MonacoEditor from "@monaco-editor/react";

type EditorProps = {
    value: string;
    onChange: (value: string | undefined) => void;
    darkMode: boolean;
};

export const Editor: React.FC<EditorProps> = (props: EditorProps) => {
    const { value, onChange, darkMode } = props;
    const theme = darkMode ? "vs-dark" : "vs-light";
    return (
        <div className="code-editor">
            <MonacoEditor
                defaultLanguage="python"
                theme={theme}
                value={value}
                className={theme}
                options={{
                    wordWrap: "on",
                    automaticLayout: true,
                    fontSize: 13,
                    fontLigatures: true,
                    formatOnType: true,
                    smoothScrolling: true,
                    autoClosingBrackets: "always",
                    tabSize: 4,
                    minimap: { enabled: false },
                    renderWhitespace: "none",
                    cursorBlinking: "smooth",
                }}
                onChange={onChange}
            />
        </div>
    );
};

Editor.displayName = "Editor";
