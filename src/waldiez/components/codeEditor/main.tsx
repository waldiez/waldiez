/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC } from "react";

import { Editor } from "@monaco-editor/react";

export const CodeEditor: FC<{
    value: string;
    onChange: (value: string | undefined) => void;
    darkMode: boolean;
}> = (props: { value: string; onChange: (value: string | undefined) => void; darkMode: boolean }) => {
    const { value, onChange, darkMode } = props;

    const theme = darkMode ? "vs-dark" : "vs-light";

    return (
        <div className="code-editor">
            <Editor
                defaultLanguage="python"
                language="python"
                theme={theme}
                value={value}
                className={theme}
                onChange={onChange}
                options={{
                    wordWrap: "on",
                    automaticLayout: true,
                    fontSize: 13,
                    fontLigatures: true,
                    renderWhitespace: "none",
                    smoothScrolling: true,
                    autoClosingBrackets: "always",
                    tabSize: 4,
                    minimap: { enabled: false },
                    cursorBlinking: "blink",
                    formatOnType: false,
                    formatOnPaste: false,
                    editContext: false,
                }}
            />
        </div>
    );
};

CodeEditor.displayName = "CodeEditor";
