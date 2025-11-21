/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

declare global {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        MonacoEnvironment?: {
            getWorker: (moduleId: string, label: string) => Worker;
        };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface WorkerGlobalScope {
        MonacoEnvironment?: {
            getWorker: (moduleId: string, label: string) => Worker;
        };
    }
}

const g = globalThis as any;

g.MonacoEnvironment = {
    getWorker(_moduleId: string, label: string): Worker {
        if (label === "json") {
            return new JsonWorker();
        }
        if (label === "css" || label === "scss" || label === "less") {
            return new CssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return new HtmlWorker();
        }
        if (label === "typescript" || label === "javascript") {
            return new TsWorker();
        }
        return new EditorWorker();
    },
};
