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
    "@xyflow/react": "^12.6.4",
    "jszip": "^3.10.1",
    "microdiff": "^1.5.0",
    "nanoid": "^5.1.5",
    "rc-slider": "^11.1.8",
    "react-error-boundary": "^6.0.0",
    "react-fast-compare": "^3.2.2",
    "react-hotkeys-hook": "^5.1.0",
    "react-icons": "^5.5.0",
    "react-markdown": "^10.1.0",
    "react-select": "^5.10.1",
    "rehype-highlight": "^7.0.2",
    "remark-gfm": "^4.0.1",
    "zundo": "^2.3.0",
    "zustand": "^5.0.5"
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

Monaco editor is used for code editing in several components(like in a waldiez tool). You can either host the required files locally or use a CDN. The `monacoVsPath` prop allows you to specify the path to the Monaco editor files.

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

#### User Input

Display an input prompt to the user and handle their response:

```tsx
import { useState } from "react";
import { WaldiezPreviousMessage, WaldiezUserInput } from "@waldiez/react";

/*
Some useful types for user input handling:

type WaldiezUserInput = {
    id: string;
    type: "input_response";
    request_id: string;
    data: {
        text?: string | null;
        image?: string | File | null;
        // to add more types here in the future (audio, document, etc.)
    };
};
type WaldiezMessageBase = {
    id: string;
    timestamp: string;
    type: string; // print/error/input_request...
    request_id?: string; // if type is input_request
    password?: boolean;
};
type WaldiezContentItem = {
    type: "text" | "image_url" | string;
    text?: string;
    image_url?: {
        url: string;
    };
    [key: string]: any; // Allow for other properties
};
type WaldiezMessageData = {
    content: string | WaldiezContentItem[];
    sender?: string;
    recipient?: string;
    [key: string]: any; // Allow for other metadata
};
type WaldiezPreviousMessage = WaldiezMessageBase & {
    data: string | WaldiezMessageData | { [key: string]: any };
};

// related props: 
inputPrompt?: {
        previousMessages: WaldiezPreviousMessage[];
        request_id: string;
        prompt: string;
        userParticipants: Set<string>;
    } | null;
onUserInput?: ((input: WaldiezUserInput) => void) | null;

// if handling the "onRun" event (through WebSockets?), 
// we could/should keep track the input requests and have the:
// - 'request_id' to pass with the user's input
// - 'inputPrompt' to show the prompt to the user
// - 'previousMessages' to send them to the chat-ui
// - 'userParticipants' to determine if a message comes from a user, an assistant or the system 
*/
function FlowWithInput() {
  const [messages, setMessages] = useState<{
    previousMessages: WaldiezPreviousMessage[];
    request_id: string;
    prompt: string;
    userParticipants: Set<string>;
  } | null>(null);
  
  const handleUserInput = (input: WaldiezUserInput) => {
    console.log("User input:", input.data.text || "");
    console.log("Request ID:", input.request_id);
    // Process input (send to the backend, etc.)
    // and close the prompt
    setInputPrompt(null);
  };

 // just an example here, this depends on how
 // we handle the messages when "onRun" is triggered
  const onNewMessage = (message: Record<string, unknown>) => {
    // extract the message.type, message.data, message.sender, message.recipient, message.request_id ...
    const newMessage: WaldiezPreviousMessage = {
      id: message.id,
      timestamp: message.timestamp,
      type: message.type,
      request_id: message.request_id,
      data: message.data,
    };
    setMessages((prev) => {
      if (prev) {
        return {
          ...prev,
          previousMessages: [...prev.previousMessages, newMessage],
        };
      }
      return {
        previousMessages: [newMessage],
        request_id: message.request_id,
        prompt: "Please provide your input:",
        userParticipants: new Set([message.sender]),
      };
    });
  };
  
  // Show a prompt (e.g., in response to some flow action)
  const showPrompt = () => {
    setInputPrompt(messages);
  };
  
  return (
    <div>
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
  monacoVsPath?: string | null;
  inputPrompt?: {
    previousMessages: WaldiezPreviousMessage[];
    prompt: string;
    request_id: string;
    userParticipants: Set<string>;
  } | null;
  readOnly?: boolean | null;
  skipImport?: boolean | null;
  skipExport?: boolean | null;
  skipHub?: boolean | null;
  onUpload?: ((files: File[]) => Promise<string[]>) | null;
  onChange?: ((flow: string) => void) | null;
  onRun?: ((flow: string) => void) | null;
  onUserInput?: ((input: WaldiezUserInput) => void) | null;
  onConvert?: ((flow: string, to: "py" | "ipynb") => void) | null;
  onSave?: ((flow: string) => void) | null;
};
//
// where:
type WaldiezUserInput = {
    id: string;
    type: "input_response";
    request_id: string;
    data: {
        text?: string | null;
        image?: string | File | null;
        // to add more types here in the future (audio?)
    };
};
//
type WaldiezMessageBase = {
    id: string;
    timestamp: string;
    type: string; // print/error/input_request...
    request_id?: string; // if type is input_request
    password?: boolean;
};
// Content structure for structured content (text, images, etc.)
type WaldiezContentItem = {
    type: "text" | "image_url" | string;
    text?: string;
    image_url?: {
        url: string;
    };
    [key: string]: any; // Allow for other properties
};
//
type WaldiezMessageData = {
    content: string | WaldiezContentItem[];
    sender?: string;
    recipient?: string;
    [key: string]: any; // Allow for other metadata
};
//
type WaldiezPreviousMessage = WaldiezMessageBase & {
    data: string | WaldiezMessageData | { [key: string]: any };
};
```

## License

This project is licensed under the [Apache License, Version 2.0 (Apache-2.0)](https://github.com/waldiez/react/blob/main/LICENSE).
