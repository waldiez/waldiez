/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
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
                // cspell: disable-next-line
                path="inmemory://file.py"
                theme={theme}
                value={value}
                className={theme}
                onChange={onChange}
                keepCurrentModel
                saveViewState={false}
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
                    editContext: false,
                    useShadowDOM: false,
                    cursorBlinking: "blink",
                    acceptSuggestionOnCommitCharacter: false,
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    wordBasedSuggestions: "off",
                    autoIndent: "none",
                    formatOnType: false,
                    formatOnPaste: false,
                }}
            />
        </div>
    );
};

CodeEditor.displayName = "CodeEditor";
