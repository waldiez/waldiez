# Waldiez React

## Make AG2 Agents Collaborate: Drag, Drop, and Orchestrate with Waldiez

![CI Build](https://github.com/waldiez/react/actions/workflows/main.yaml/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/waldiez/react/badge.svg)](https://coveralls.io/github/waldiez/react) [![npm version](https://badge.fury.io/js/@waldiez%2Freact.svg)](https://badge.fury.io/js/@waldiez%2Freact)

## Installation from npm registry

```bash
# any of the following
npm install @waldiez/react
yarn add @waldiez/react
pnpm add @waldiez/react
bun add @waldiez/react
```

## Requirements for development

- Node.js (version 22.x or later)
- bun@1.2.12

## Libraries

```json
{
    "@monaco-editor/react": "^4.7.0",
    "@xyflow/react": "^12.5.6",
    "jszip": "^3.10.1",
    "microdiff": "^1.5.0",
    "nanoid": "^5.1.5",
    "rc-slider": "^11.1.8",
    "react-error-boundary": "^5.0.0",
    "react-fast-compare": "^3.2.2",
    "react-hotkeys-hook": "^5.0.1",
    "react-icons": "^5.5.0",
    "react-select": "^5.10.1",
    "zundo": "^2.3.0",
    "zustand": "^5.0.3"
}
```

## Usage

```tsx
// npm|yarn|pnpm|bun|whatever add|install @waldiez/react
import React from "react";
import ReactDOM from "react-dom/client";

import { Waldiez } from "@waldiez/react";
import "@waldiez/react/dist/@waldiez.css";

const isProd = import.meta.env.PROD;

// the actions should be handled by other components
// that use `Waldiez` as a child component
/**
 *OnChange
 */
const onChange = null;
// const onChange = (flowJson: any) => {
//   console.info(JSON.stringify(JSON.parse(flowJson), null, 2));
// };

/**
 * OnSave
 * if enabled, add a listener for the key combination (ctrl+s/mod+s)
 * to save the flow
 * the flow string is the JSON stringified flow
 * the action should be handled by the parent component
 */
const onSaveDev = (flowString: string) => {
    console.info("saving", flowString);
};
const onSave = isProd ? null : onSaveDev;
/**
 * UserInput
 */
// to check/test the user input, use `onUserInput` and `inputPrompt`
// reset `inputPrompt` to `null` to remove/hide the modal
// these two props are used to show a modal to the user
// and get the user input
// Example:
//
// const [ inputPrompt, setInputPrompt ] = useState<{
//   previousMessages: string[];
//   prompt: string;
// } | null>(null);
//
// const onUserInput = (input: string) => {
//   const allMessages = input.split('\n');
//   const previousMessages = allMessages.slice(0, allMessages.length - 1);
//   const prompt = allMessages[allMessages.length - 1];
//   setInputPrompt({ previousMessages, prompt });
// };

// const inputPrompt = {
//   previousMessages: ['Hello, World!', 'How\n are you?'],
//   prompt: 'What is your name?'
// };
// const onUserInput = (input: string) => {
//   console.info(input);
// };
const inputPrompt = null;
const onUserInput = null;

/**
 * OnRun
 * adds a button to the main panel, to run the code.
 * The action should be handled by the parent component
 * "running" the flow happens in the python part / backend
 * the flow string is the JSON stringified flow
 */
const onRunDev = (flowString: string) => {
    console.info(flowString);
};
const onRun = isProd ? null : onRunDev;

/**
 * OnConvert
 * adds two buttons to the main panel, to convert the flow to python or jupyter notebook
 * The action should be handled by the parent component
 * the flow string is the JSON stringified flow
 * the `to` parameter is either 'py' or 'ipynb'
 * the conversion happens in the python part / backend
 */

const onConvertDev = (_flowString: string, to: "py" | "ipynb") => {
    console.info("converting to", to);
};
const onConvert = isProd ? null : onConvertDev;
/**
 * readOnly
 * if true, only the theme button is shown
 * only zoom and viewport are enabled, no further actions are allowed
 */
const readOnly: boolean | undefined | null = undefined;

/**
 * skipImport and skipExport
 * if true, the import and export buttons are not added to the main panel
 */
const skipImport = false;
const skipExport = false;
/**
 * OnUpload
 * on RAG user: adds a dropzone to upload files
 * when triggered, the files are sent to the backend,
 * returning the paths of the uploaded files
 * and the 'docsPath' in RAG retrieveConfig is updated.
 * the paths can be either relative or absolute,
 * this depends on how we run the flow
 * (the docsPath will have to be updated accordingly if needed on the backend)
 */
const onUploadDev = (files: File[]) => {
    return new Promise<string[]>(resolve => {
        const uploadedFiles: string[] = [];
        const promises = files.map(file => {
            // simulate uploading files
            return new Promise<string>(resolve => {
                setTimeout(() => {
                    uploadedFiles.push(`path/to/${file.name}`);
                    resolve(`path/to/${file.name}`);
                }, 2000);
            });
        });
        Promise.all(promises).then(() => {
            resolve(uploadedFiles);
        });
    });
};
const onUpload = isProd ? null : onUploadDev;

/**
 * Monaco Editor
 */
// DEV: downloaded in `public/vs` folder (.gitignored)
// PROD:
//  either served and `VITE_VS_PATH` is set to the path, or
//  use the default cdn (jsdelivr) that monaco loader uses
// make sure the csp allows the cdn
let vsPath = !isProd ? "vs" : (import.meta.env.VITE_VS_PATH ?? null);
if (!vsPath) {
    // if set to empty string, make it null
    vsPath = null;
}
/**
  Other props:
   we can use:
  `import { importFlow } from '@waldiez/react';`
   to import an existing flow from a waldiez/json file
   import { ReactFlowJsonObject } from "@xyflow/react";
    // ReactFlowJsonObject: nodes: NodeType[]; edges: EdgeType[]; viewport: Viewport;

   // all the props:
   type WaldiezFlowProps = ReactFlowJsonObject & {
        flowId: string;
        isAsync?: boolean;
        cacheSeed?: number | null;
        storageId: string;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        viewport?: Viewport;
        createdAt?: string;
        updatedAt?: string;
    };
    type WaldiezProps = WaldiezFlowProps & {
        nodes: Node[];
        edges: Edge[];
        viewport?: Viewport;
        monacoVsPath?: string | null;
        inputPrompt?: {
            previousMessages: string[];
            prompt: string;
        } | null;
        readOnly?: boolean | null;
        skipImport?: boolean | null;
        skipExport?: boolean | null;
        onUpload?: ((files: File[]) => Promise<string[]>) | null;
        onChange?: ((flow: string) => void) | null;
        onRun?: ((flow: string) => void) | null;
        onUserInput?: ((input: string) => void) | null;
        onConvert?: ((flow: string, to: "py" | "ipynb") => void) | null;
        onSave?: ((flow: string) => void) | null;
    };

    // Alternative:
    // use the ones we want to override
    const overrides: Partial<WaldiezProps> = {
        monacoVsPath: vsPath,
        onUserInput,
        flowId: "flow-0",
        storageId: "storage-0",
        inputPrompt,
        onRun,
        onConvert,
        onChange,
        onUpload,
        onSave,
        readOnly,
        skipImport,
        skipExport,
    }
    const imported = importFlow("path/to/flow.json");
    <Waldiez {...imported} {...overrides} />
    // example:
    <Waldiez {...imported} readOnly={readOnly} skipExport={skipExport} skipImport={skipImport} />
 */

const startApp = () => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <Waldiez
                monacoVsPath={vsPath}
                onUserInput={onUserInput}
                flowId="flow-0"
                storageId="storage-0"
                inputPrompt={inputPrompt}
                onRun={onRun}
                onConvert={onConvert}
                onChange={onChange}
                onUpload={onUpload}
                onSave={onSave}
                readOnly={readOnly}
                skipImport={skipImport}
                skipExport={skipExport}
            />
        </React.StrictMode>,
    );
};

startApp();
```

## License

This project is licensed under the [Apache License, Version 2.0 (Apache-2.0)](https://github.com/waldiez/react/blob/main/LICENSE).
