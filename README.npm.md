# Waldiez React

## Make AG2 Agents Collaborate: Drag, Drop, and Orchestrate with Waldiez

[![Coverage Status](https://coveralls.io/repos/github/waldiez/waldiez/badge.svg)](https://coveralls.io/github/waldiez/waldiez) [![npm version](https://badge.fury.io/js/@waldiez%2Freact.svg)](https://badge.fury.io/js/@waldiez%2Freact)

A React component for creating, editing, and running `waldiez` based applications.

To just include waldiez on your website using CDN, here is a simple example:

```html
<!doctype html>
<!--suppress JSUnresolvedLibraryURL, NpmUsedModulesInstalled -->
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@19.1.1",
              "react-dom/client": "https://esm.sh/react-dom@19.1.1/client",
              "@waldiez/react": "https://esm.sh/@waldiez/react"
            }
          }
        </script>
        <style>
            body {
                margin: 0;
                padding: 0;
                justify-content: center;
                background-color: white;
                color: black;
            }
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: black;
                    color: white;
                }
            }
            #loading {
                width: 100vw;
                height: 100vh;
                padding: 0;
                margin: 0;
                display: flex;
                align-items: center;
            }
            #root {
                display: flex;
                flex-direction: column;
                width: 100vw;
                height: 100vh;
            }
            #waldiez-root {
                position: relative;
                width: 80vw;
                height: 80vh;
                margin: auto;
            }
        </style>
        <link rel="stylesheet" href="https://esm.sh/@waldiez/react/dist/@waldiez.css">
    </head>
    <body>
        <div id="root"></div>
        <div id="loading">
            Loading...
        </div>
        <script type="module" src="https://esm.sh/tsx"></script>
        <script type="text/babel">
          import { createRoot } from "react-dom/client"
          import { Waldiez } from "@waldiez/react";
          const root = document.getElementById("root");
          document.getElementById("loading").style.display = "none";
          createRoot(root).render(
            <div id="waldiez-root">
              <Waldiez />
            </div>
          )
        </script>
    </body>
</html>
```

## Installation from npm registry

```bash
# any of the following
npm install @waldiez/react
yarn add @waldiez/react
pnpm add @waldiez/react
bun add @waldiez/react
```

## Development requirements

- Node.js >= 22.x
- bun@latest

## Basic Usage

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
);
```

### Configuration Options

#### Core Properties

These properties define the basic identity and metadata of your flow:

```tsx
<Waldiez
  flowId="unique-flow-id"             // Unique identifier for this flow
  storageId="storage-id"              // ID for storing flow state
  name="My Flow"                      // Display name
  description="Flow description"      // Description text
  tags={["tag1", "tag2"]}             // Categorization tags
  requirements={[]}                   // Dependencies/requirements
  nodes={[]}                          // Initial nodes in the flow
  edges={[]}                          // Initial edges in the flow
/>
```

#### User Interaction

These props allow user interactions with your component:

  <!-- // Hide hub integration for import/export if true
  skipHub={false} -->

```tsx
<Waldiez
  // Control whether the flow is read-only
  readOnly={false}
  
  // Hide import/export buttons if set to true
  skipImport={false}
  skipExport={false}
/>
```

#### Event Handlers

##### `onChange`

Triggered when the flow is changed:

```tsx
<Waldiez
  onChange={(flowString: string) => {
    console.log("Flow changed:", JSON.parse(flowString));
    // Persist changes, update state, etc.
  }}
/>
```

##### `onSave`

Triggered when the user presses Ctrl+S/Cmd+S:

```tsx
<Waldiez
  onSave={(flowString: string) => {
    console.log("Saving flow...");
    // Save flow to backend, file, etc.
  }}
/>
```

#### `onRun`

Adds a "Run" button to the main panel:

```tsx
<Waldiez
  onRun={(flowString) => {
    console.log("Running flow...");
    // Execute the flow, typically sending to a backend
  }}
/>
```

#### `onConvert`

Adds buttons to convert the flow to Python or Jupyter notebook:

```tsx
<Waldiez
  onConvert={(flowString: string, to: 'py' | 'ipynb') => {
    console.log(`Converting flow to ${to}`);
    // Convert flow to Python (.py) or Jupyter (.ipynb)
    // 'to' parameter is either 'py' or 'ipynb'
  }}
/>
```

#### `onUpload`

Handles file uploads, particularly useful for RAG nodes:

```tsx
<Waldiez
  onUpload={(files: File[]) => {
    console.log("Uploading files:", files.map(f => f.name));
    
    // Returns a promise that resolves to an array of file paths
    return new Promise<string[]>((resolve) => {
      // Send files to backend, get paths, etc.
      setTimeout(() => {
        const paths = files.map(file => `path/to/${file.name}`);
        resolve(paths);
      }, 1000);
    });
  }}
/>
```

### Working with Existing Flows

You can import flows from existing Waldiez files:

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

### Types

The component accepts these prop types:

```typescript
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
//
type WaldiezProps = WaldiezFlowProps & {
  nodes: Node[];
    edges: Edge[];
    viewport?: Viewport;
    chat?: WaldiezChatConfig;
    stepByStep?: WaldiezStepByStep;
    readOnly?: boolean;
    skipImport?: boolean;
    skipExport?: boolean;
    skipHub?: boolean;
    onUpload?: (files: File[]) => Promise<string[]>;
    onChange?: (flow: string) => void;
    onRun?: (flow: string) => void;
    onStepRun?: (flow: string) => void;
    onConvert?: (flow: string, to: "py" | "ipynb") => void;
    onSave?: (flow: string) => void;
};
//
// where:
type WaldiezChatConfig = {
    show: boolean;
    active: boolean;
    messages: WaldiezChatMessage[];
    userParticipants: string[] | WaldiezChatParticipant[];
    activeRequest?: WaldiezActiveRequest;
    error?: WaldiezChatError;
    handlers?: WaldiezChatHandlers;
    timeline?: WaldiezTimelineData;
    mediaConfig?: WaldiezMediaConfig;
};
type WaldiezStepByStep = {
    show: boolean;
    active: boolean;
    stepMode: boolean;
    autoContinue: boolean;
    breakpoints: (string | WaldiezBreakpoint)[];
    stats?: WaldiezDebugStats["stats"];
    eventHistory: Array<Record<string, unknown>>;
    currentEvent?: Record<string, unknown>;
    help?: WaldiezDebugHelp["help"];
    lastError?: string;
    participants?: WaldiezChatParticipant[];
    timeline?: WaldiezTimelineData;
    pendingControlInput: {
        request_id: string;
        prompt: string;
    } | null;
    activeRequest: WaldiezActiveRequest | null;
    handlers: WaldiezStepHandlers;
};
type WaldiezActiveRequest = {
    request_id: string;
    prompt: string;
    password?: boolean;
    acceptedMediaTypes?: WaldiezMediaType[];
};
type WaldiezChatHandlers = {
    onUserInput?: (input: WaldiezChatUserInput) => void;
    onMediaUpload?: (media: WaldiezMediaContent) => Promise<string>;
    onChatError?: (error: WaldiezChatError) => void;
    onMessageStreamEvent?: (event: WaldiezStreamEvent) => void;
    onInterrupt?: () => void;
    onClose?: () => void;
};
type WaldiezStepHandlers = {
    sendControl: (input: Pick<WaldiezDebugInputResponse, "request_id" | "data">) => void | Promise<void>;
    respond: (response: WaldiezChatUserInput) => void | Promise<void>;
    close?: () => void | Promise<void>;
};
type WaldiezChatError = {
    message: string;
    code?: string;
};
type WaldiezChatMessageCommon = {
    id: string;
    timestamp: string | number;
    type: WaldiezChatMessageType;
    sender?: string;
    recipient?: string;
    request_id?: string;
} & {
    [key: string]: any;
};
type WaldiezChatContent =
    | WaldiezMediaContent
    | WaldiezMediaContent[]
    | { content: WaldiezMediaContent | WaldiezMediaContent[] | string }
    | string;

type WaldiezChatMessage = WaldiezChatMessageCommon & {
    content: WaldiezChatContent;
};
// ...
```

## License

This project is licensed under the [Apache License, Version 2.0 (Apache-2.0)](https://github.com/waldiez/react/blob/main/LICENSE).
