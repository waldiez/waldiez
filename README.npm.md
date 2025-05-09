# Waldiez React

## Make AG2 Agents Collaborate: Drag, Drop, and Orchestrate with Waldiez

[![Coverage Status](https://coveralls.io/repos/github/waldiez/react/badge.svg)](https://coveralls.io/github/waldiez/react) [![npm version](https://badge.fury.io/js/@waldiez%2Freact.svg)](https://badge.fury.io/js/@waldiez%2Freact)

A React component for creating, editing, and running `waldiez` based applications.

## Installation from npm registry

```bash
# any of the following
npm install @waldiez/react
yarn add @waldiez/react
pnpm add @waldiez/react
bun add @waldiez/react
```

## Libraries

```json
{
    "@monaco-editor/react": "^4.7.0",
    "@xyflow/react": "^12.6.0",
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
    "zustand": "^5.0.4"
}
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

#### Monaco Editor Configuration

Monaco editor is used for code editing in several components(like in a waldiez skill). You can either host the required files locally or use a CDN. The `monacoVsPath` prop allows you to specify the path to the Monaco editor files.

```tsx
// In development, use local 'vs' folder in public directory
// In production, set VITE_VS_PATH or use the default CDN
// this means that http(s)://your.domain.com/vs/loader.js should be accessible.
<Waldiez
  monacoVsPath="vs"  // Path to Monaco editor files, or null to use CDN
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
  onChange={(flowJson) => {
    console.log("Flow changed:", JSON.parse(flowJson));
    // Persist changes, update state, etc.
  }}
/>
```

##### `onSave`

Triggered when the user presses Ctrl+S/Cmd+S:

```tsx
<Waldiez
  onSave={(flowString) => {
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
  onConvert={(flowString, to) => {
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
  onUpload={(files) => {
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

#### User Input

Display an input prompt to the user and handle their response:

```tsx
import { useState } from "react";

function FlowWithInput() {
  const [inputPrompt, setInputPrompt] = useState<{
    previousMessages: string[];
    prompt: string;
  } | null>(null);
  
  const handleUserInput = (input: string) => {
    console.log("User input:", input);
    // Process input, then clear the prompt
    setInputPrompt(null);
  };
  
  // Show a prompt (e.g., in response to some flow action)
  const showPrompt = () => {
    setInputPrompt({
      previousMessages: ["System: Processing your request..."],
      prompt: "Please provide additional information:"
    });
  };
  
  return (
    <div>
      <button onClick={showPrompt}>Request Input</button>
      <Waldiez
        flowId="flow-with-input"
        storageId="storage-with-input"
        inputPrompt={inputPrompt}
        onUserInput={handleUserInput}
        // ...other props
      />
    </div>
  );
}
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

The component accepts these main prop types:

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
  skipHub?: boolean | null;
  onUpload?: ((files: File[]) => Promise<string[]>) | null;
  onChange?: ((flow: string) => void) | null;
  onRun?: ((flow: string) => void) | null;
  onUserInput?: ((input: string) => void) | null;
  onConvert?: ((flow: string, to: "py" | "ipynb") => void) | null;
  onSave?: ((flow: string) => void) | null;
};
```

## License

This project is licensed under the [Apache License, Version 2.0 (Apache-2.0)](https://github.com/waldiez/react/blob/main/LICENSE).
