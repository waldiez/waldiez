/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */
/**
 * @categoryDescription React component for Waldiez
 * @showCategories
 * @module
 */
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HotkeysProvider } from "react-hotkeys-hook";

import { loader } from "@monaco-editor/react";

import { ErrorPage } from "@waldiez/components/error";
import { SnackbarProvider } from "@waldiez/components/snackbar";
import { WaldiezFlowView } from "@waldiez/containers/flow";
import { SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezProvider } from "@waldiez/store";
import "@waldiez/styles/index.css";
import { WaldiezThemeProvider, isInitiallyDark, setIsDarkMode } from "@waldiez/theme";
import { WaldiezProps } from "@waldiez/types";
import { getId } from "@waldiez/utils";

const READY_FOR_HUB = true;

/**
 * Waldiez component
 * @param props - The props of the component
 * @primaryExport
 * @category Component
 * @example
```tsx
import React from "react";
import ReactDOM from "react-dom/client";

import { Edge, Node, Viewport } from "@xyflow/react";

import { Waldiez, importFlow } from "@waldiez/react";
import "@waldiez/react/dist/@waldiez.css";

// starting with an empty flow
const nodes: Node[] = []
const edges: Edge[] = []
const viewport: Viewport = { x: 0, y: 0, zoom: 1 }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Waldiez
      flowId="flow-0"
      storageId="storage-0"
      name="My Flow"
      description="A sample flow"
      tags={["example"]}
      requirements={[]}
      nodes={nodes}
      edges={edges}
      viewport={viewport}
    />
  </React.StrictMode>
```
 * @example
```tsx
 import { Waldiez, importFlow, WaldiezProps } from "@waldiez/react";

// Import flow from an existing .waldiez file
// could be loaded from a backend or local storage
const flowJson = {
  // existing data
};

const flowData = importFlow(flowJson);

// Override specific properties
const overrides: Partial<WaldiezProps> = {
  onSave: (flow) => saveToBackend(flow),
  readOnly: isViewMode,
  skipImport: true,
};

function ExistingFlow() {
  return (
    <Waldiez
      {...flowData}
      {...overrides}
    />
  );
}
```
 * @see {@link WaldiezProps}
 */
export const Waldiez: React.FC<Partial<WaldiezProps>> = (props: Partial<WaldiezProps>) => {
    const flowId: string = props.flowId ?? `wf-${getId()}`;
    const skipImport = typeof props.skipImport === "boolean" ? props.skipImport : false;
    const skipExport = typeof props.skipExport === "boolean" ? props.skipExport : false;
    const skipHub = typeof props.skipHub === "boolean" ? props.skipHub : !READY_FOR_HUB;
    const nodes = props.nodes ?? [];
    const edges = props.edges ?? [];
    const readOnly = props.readOnly ?? false;
    const { monacoVsPath, chat } = props;
    useEffect(() => {
        checkInitialBodyThemeClass();
        checkInitialBodySidebarClass();
        // make sure no leftover lock
        window.localStorage.removeItem(`snackbar-${flowId}.lock`);
    }, [flowId]);
    useEffect(() => {
        if (monacoVsPath) {
            loader.config({ paths: { vs: monacoVsPath } });
        }
    }, [monacoVsPath]);
    return (
        <SnackbarProvider>
            <WaldiezThemeProvider>
                <ErrorBoundary fallbackRender={fallbackRender}>
                    <HotkeysProvider initiallyActiveScopes={[flowId]}>
                        <ReactFlowProvider>
                            <SidebarProvider>
                                <WaldiezProvider
                                    {...props}
                                    flowId={flowId}
                                    nodes={nodes}
                                    edges={edges}
                                    isReadOnly={readOnly}
                                    skipImport={skipImport}
                                    skipExport={skipExport}
                                >
                                    <WaldiezFlowView
                                        flowId={flowId}
                                        skipImport={skipImport}
                                        skipExport={skipExport}
                                        skipHub={skipHub}
                                        chat={chat}
                                    />
                                </WaldiezProvider>
                            </SidebarProvider>
                        </ReactFlowProvider>
                    </HotkeysProvider>
                </ErrorBoundary>
            </WaldiezThemeProvider>
        </SnackbarProvider>
    );
};

type errorRenderProps = {
    error: Error;
    resetErrorBoundary: (...args: any[]) => void;
};
const fallbackRender = (props: errorRenderProps) => {
    // Call resetErrorBoundary() to reset the error boundary and retry the render.
    const { error } = props;
    console.error("Error in Waldiez component:", error);
    return <ErrorPage error={error} />;
};

const checkInitialBodyThemeClass = () => {
    const isDark = isInitiallyDark();
    setIsDarkMode(isDark);
};

const checkInitialBodySidebarClass = () => {
    // if the initial body class is not set,
    // set it based on the user's preference
    if (
        !document.body.classList.contains("waldiez-sidebar-collapsed") &&
        !document.body.classList.contains("waldiez-sidebar-expanded")
    ) {
        const sidebarQuery = window.matchMedia("(prefers-sidebar: collapsed)");
        if (sidebarQuery.matches) {
            document.body.classList.add("waldiez-sidebar-collapsed");
        } else {
            document.body.classList.add("waldiez-sidebar-expanded");
        }
    }
};
