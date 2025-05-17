/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Waldiez, WaldiezProps, importFlow } from "@waldiez";

// Import the development wrapper component
import { Edge, Node } from "@xyflow/react";

import React from "react";
import ReactDOM from "react-dom/client";

import { nanoid } from "nanoid";

import "./index.css";
import { WaldiezWrapper } from "./wrapped";

/**
 * Environment Configuration
 * ------------------------
 * - isProd: Determines if we're in production mode
 * - USE_DEV_SERVER: Determines if we should use the WebSocket dev server (to communicate with the python part)
 * - DEFAULT_WS_URL: Default WebSocket URL for development server
 *
 * Note: The WebSocket URL can be overridden by the VITE_DEV_WS_URL environment variable.
 * If VITE_USE_DEV_SERVER is set to "true", make sure the dev server is running (../scripts/dev_server.py).
 */
const isProd = import.meta.env.PROD;
const USE_DEV_SERVER = import.meta.env.VITE_USE_DEV_SERVER === "true" && !isProd;
const DEFAULT_WS_URL = import.meta.env.VITE_DEV_WS_URL || "ws://localhost:7654";

/**
 * Monaco Editor Configuration
 * --------------------------
 * - In DEV: Uses local 'vs' folder (should be in public directory)
 * - In PROD: Uses provided path or defaults to CDN
 */
let vsPath = !isProd ? "vs" : import.meta.env.VITE_VS_PATH || null;
if (vsPath === "") {
    vsPath = null;
}
/**
 * Default Development Handlers
 * ---------------------------
 * These handlers provide sensible defaults for development
 * but are replaced by the WebSocket server when USE_DEV_SERVER is true
 */
const devHandlers = {
    // Log changes to the flow
    onChange: undefined,

    // Handle save requests (triggered by Ctrl+S/Cmd+S)
    onSave: (flowString: string) => {
        console.info("[DEV] Saving flow:", flowString.substring(0, 100) + "...");
    },

    // Handle run requests
    onRun: (flowString: string) => {
        console.info("[DEV] Running flow:", flowString.substring(0, 100) + "...");
    },

    // Handle conversion requests (to Python or Jupyter)
    onConvert: (_flowString: string, to: "py" | "ipynb") => {
        console.info("[DEV] Converting flow to", to);
    },

    // Simulate file uploads with random success/failure
    onUpload: (files: File[]) => {
        console.info("[DEV] Uploading files:", files.map(f => f.name).join(", "));

        // Random rejection for testing error handling
        if (Math.random() < 0.2) {
            return Promise.reject("Simulated upload error");
        }

        return new Promise<string[]>(resolve => {
            const uploadedFiles: string[] = [];
            const promises = files.map(file => {
                return new Promise<string>(resolve => {
                    setTimeout(() => {
                        const filePath = `path/to/${file.name}`;
                        uploadedFiles.push(filePath);
                        resolve(filePath);
                    }, 1000); // Simulate network delay
                });
            });

            Promise.all(promises).then(() => {
                console.info("[DEV] Files uploaded:", uploadedFiles);
                resolve(uploadedFiles);
            });
        });
    },
};

/**
 * Feature Flags
 * ------------
 * Control which features are enabled/disabled
 */
const featureFlags = {
    readOnly: undefined, // If true, only viewing is allowed (no editing)
    skipImport: false, // If true, hides the import button
    skipExport: false, // If true, hides the export button
    skipHub: isProd, // If true, skips hub integration for import/export
};

/**
 * Default Waldiez Props
 * -------------------
 * Basic configuration for the Waldiez component
 */
const flowId = `wf-${nanoid()}`;
const defaultWaldiezProps: Partial<WaldiezProps> = {
    flowId,
    isAsync: false,
    cacheSeed: 41,
    storageId: flowId,
    monacoVsPath: vsPath,
    viewport: undefined,
    ...(isProd
        ? {
              onChange: undefined,
              onSave: undefined,
              onRun: undefined,
              onConvert: undefined,
              onUpload: undefined,
          }
        : !USE_DEV_SERVER
          ? {
                // Only include these handlers if not using the dev server
                ...devHandlers,
            }
          : {}),
};

/**
 * Get Waldiez Props
 * ---------------
 * Fetches flow data from URL if specified in query parameters
 * Otherwise returns default props
 */
export const getProps = (): Promise<Partial<WaldiezProps>> => {
    return new Promise<Partial<WaldiezProps>>(resolve => {
        let waldiezProps = { ...defaultWaldiezProps };
        const urlParams = new URLSearchParams(window.location.search);
        const flowUrl = urlParams.get("flow");

        // If no flow URL is provided, use default props
        if (!flowUrl || !flowUrl.startsWith("http")) {
            console.info("No valid flow URL provided, using default configuration");
            return resolve(waldiezProps);
        }

        // Attempt to fetch flow from URL
        console.info(`Fetching flow from: ${flowUrl}`);
        fetch(flowUrl, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(10000),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch flow: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(flow => {
                console.info("Successfully loaded flow from URL");
                waldiezProps = {
                    ...waldiezProps,
                    ...importFlow(flow),
                };
                resolve(waldiezProps);
            })
            .catch(error => {
                console.warn(`Error loading flow from URL: ${error.message}`);
                resolve(waldiezProps);
            });
    });
};

/**
 * Start Application
 * ---------------
 * Initializes and renders the Waldiez component or WebSocket wrapper
 */
export const startApp = (waldiezProps: Partial<WaldiezProps> = defaultWaldiezProps) => {
    // Clear URL parameters after loading
    window.history.replaceState({}, document.title, window.location.pathname);

    // Get the root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
        console.error("Root element not found");
        return;
    }

    // Create root
    const root = ReactDOM.createRoot(rootElement);

    // Decide whether to use the WebSocket wrapper or direct component
    if (USE_DEV_SERVER) {
        console.info("Using WebSocket development server at:", DEFAULT_WS_URL);
        root.render(
            <React.StrictMode>
                <WaldiezWrapper
                    waldiezProps={{
                        ...waldiezProps,
                        ...featureFlags,
                        name: waldiezProps.name ?? "Waldiez Flow",
                        description: waldiezProps.description ?? "Waldiez Flow",
                        tags: waldiezProps.tags ?? [],
                        requirements: waldiezProps.requirements ?? [],
                        flowId: waldiezProps.flowId ?? flowId,
                        storageId: waldiezProps.storageId ?? flowId,
                        nodes: waldiezProps.nodes ?? ([] as Node[]),
                        edges: waldiezProps.edges ?? ([] as Edge[]),
                        viewport: waldiezProps.viewport ?? { x: 0, y: 0, zoom: 1 },
                    }}
                    wsUrl={DEFAULT_WS_URL}
                />
            </React.StrictMode>,
        );
    } else {
        console.info("Using direct component integration");
        root.render(
            <React.StrictMode>
                <Waldiez {...waldiezProps} {...featureFlags} />
            </React.StrictMode>,
        );
    }
};

// Initialize the application
getProps().then(startApp);
