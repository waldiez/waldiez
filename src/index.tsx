/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */
import { Waldiez, WaldiezPreviousMessage, WaldiezProps, WaldiezUserInput, importFlow } from "@waldiez";

import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { nanoid } from "nanoid";

import "./index.css";

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
 * Handling user input:
 *
 * onUserInput?: ((input: WaldiezUserInput) => void) | null;
 *
 * inputPrompt?: {
        previousMessages: WaldiezPreviousMessage[];
        prompt: string;
    } | null;
 *
 * `onUserInput` is a function that handles the user input
 * `inputPrompt` is an object that contains the previous messages
 * and the prompt to show to the user
*/
//
// type WaldiezUserInput = {
//     id: string;
//     type: "input_response";
//     request_id: string;
//     data: {
//         text?: string | null;
//         image?: string | File | null;
//         // to add more types here in the future (audio?)
//     };
// };
// Previous messages are passed to the modal
// to show the user the context of the conversation
// the type of one previous message is:
// type WaldiezPreviousMessage = {
//     id: string;
//     timestamp: string;
//     type: string; // print/error/input_request...
//     data: string | { [key: string]: any };
// };
//
//
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
 * skipHub
 * if true, `exporting` will be a modal with an option to upload the flow to the hub
 * also, importing will include a `search` option to search the hub
 */
const skipHub = isProd;

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
    // reject randomly
    if (Math.random() < 0.4) {
        return Promise.reject("Error uploading files");
    }
    return new Promise<string[]>(resolve => {
        const uploadedFiles: string[] = [];
        const promises = files.map(file => {
            // simulate uploading files
            return new Promise<string>(resolve => {
                setTimeout(() => {
                    if (Math.random() > 0.8) {
                        uploadedFiles.push(null as any);
                    } else {
                        uploadedFiles.push(`path/to/${file.name}`);
                    }
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

const flowId = `wf-${nanoid()}`;
const defaultWaldiezProps: Partial<WaldiezProps> = {
    monacoVsPath: vsPath,
    onRun,
    onConvert,
    onChange,
    onUpload,
    onSave,
    flowId,
    isAsync: false,
    cacheSeed: 41,
    storageId: flowId,
};

export const getProps = () => {
    return new Promise<Partial<WaldiezProps>>(resolve => {
        let waldiezProps = { ...defaultWaldiezProps };
        const haveFlowInQuery = window.location.search.includes("flow");
        if (haveFlowInQuery) {
            const urlParams = new URLSearchParams(window.location.search);
            const flowUrl = urlParams.get("flow");
            if (flowUrl && flowUrl.startsWith("http")) {
                try {
                    fetch(flowUrl, {
                        method: "GET",
                        redirect: "follow",
                        signal: AbortSignal.timeout(10000),
                    })
                        .then(response => response.json())
                        .then(flow => {
                            waldiezProps = {
                                ...importFlow(flow),
                            };
                            resolve(waldiezProps);
                        })
                        .catch(_ => {
                            resolve(waldiezProps);
                        });
                } catch (_) {
                    resolve(waldiezProps);
                }
            }
        } else {
            resolve(waldiezProps);
        }
    });
};

// just to trigger the user input modal:
const initialPrompt: {
    previousMessages: WaldiezPreviousMessage[];
    prompt: string;
    request_id: string;
} | null = {
    previousMessages: [
        {
            id: nanoid(),
            timestamp: new Date().toISOString(),
            type: "print",
            data: {
                text: "Hello, how can I help you?",
            },
        },
    ],
    prompt: "What is your name?",
    request_id: nanoid(),
};

// const initialPrompt: {
//     previousMessages: WaldiezPreviousMessage[];
//     prompt: string;
// } | null = null;

export const startApp = (waldiezProps: Partial<WaldiezProps> = defaultWaldiezProps) => {
    // the wrapper should better be in a separate file,
    // but for the sake of the example, we put it here
    const WaldiezWrapper = (waldiezProps: Partial<WaldiezProps>) => {
        const [conversation, setConversation] = useState<{
            previousMessages: WaldiezPreviousMessage[];
            prompt: string;
            request_id: string;
        } | null>(initialPrompt);
        const [emptyMessagesCount, setEmptyMessagesCount] = useState(0);
        const onEmptyMessage = () => {
            if (emptyMessagesCount > 5) {
                console.warn("Too many empty messages, stop spamming");
                setConversation(null);
                setEmptyMessagesCount(0);
            } else {
                setEmptyMessagesCount(emptyMessagesCount + 1);
            }
        };
        const onUserInput = (input: WaldiezUserInput) => {
            console.info("input: ", input);
            if (!input.data.text && !input.data.image) {
                onEmptyMessage();
                // or just assume Esc/Cancel, so send an empty input to the backend
                throw new Error("No input provided");
            }
            setEmptyMessagesCount(0);
            console.info("submitted text: ", input.data.text);
            if (input.data.image) {
                console.info("submit base64 image");
                return;
            }
            const newMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "input_response",
                data: input.data.text ?? "\n",
            };
            setConversation(prev => {
                if (!prev) {
                    return {
                        previousMessages: [newMessage],
                        prompt: "",
                        request_id: input.request_id,
                    };
                }
                return {
                    previousMessages: [...prev.previousMessages, newMessage],
                    prompt: `Did you say \`${input.data.text}\` ?`,
                    request_id: input.request_id,
                };
            });
        };
        // "waldiez-wrapper" (just an example) can be used to
        // style the component that wraps the waldiez flow view
        return (
            <div className="waldiez-wrapper">
                <Waldiez
                    {...waldiezProps}
                    readOnly={readOnly}
                    skipExport={skipExport}
                    skipImport={skipImport}
                    skipHub={skipHub}
                    inputPrompt={conversation}
                    onUserInput={onUserInput}
                />
            </div>
        );
    };
    window.history.replaceState({}, document.title, window.location.pathname);
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <WaldiezWrapper {...waldiezProps} />
        </React.StrictMode>,
    );
};

getProps().then(startApp);
