/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { MessageInput } from "@waldiez/components/messageInput";
import { WaldiezMessage } from "@waldiez/models";

const onTypeChange = vi.fn();
const onMessageChange = vi.fn();
const messageInputProps = {
    current: {
        type: "none",
        useCarryover: false,
        content: "",
        context: {},
    } as WaldiezMessage,
    defaultContent: "test",
    darkMode: false,
    selectLabel: "test",
    selectTestId: "test",
    onTypeChange,
    onMessageChange,
    includeContext: false,
    skipCarryoverOption: true,
    skipRagOption: true,
};
const messageInputWithStringType = {
    ...messageInputProps,
    current: {
        type: "string",
        useCarryover: false,
        content: "",
        context: {},
    } as WaldiezMessage,
};

beforeEach(() => {
    onTypeChange.mockClear();
    onMessageChange.mockClear();
});

describe("MessageInput", () => {
    it("should render successfully", () => {
        const { baseElement } = render(<MessageInput {...messageInputProps} />);
        expect(baseElement).toBeTruthy();
    });
    it("should render with not none label", () => {
        const customMessageInputProps = {
            ...messageInputWithStringType,
            notNoneLabel: "test",
        };
        const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
        expect(baseElement).toBeTruthy();
    });
    it("should render with not none label info", () => {
        const customMessageInputProps = {
            ...messageInputWithStringType,
            notNoneLabelInfo: "test",
        };
        const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
        expect(baseElement).toBeTruthy();
    });
    it("should handle type change", async () => {
        render(<MessageInput {...messageInputProps} />);
        const select = screen.getByRole("combobox");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Text");
        expect(onTypeChange).toHaveBeenCalledWith("string");
    });
    it("should handle type change to none", async () => {
        render(<MessageInput {...messageInputWithStringType} />);
        const select = screen.getByRole("combobox");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "None");
        expect(onTypeChange).toHaveBeenCalledWith("none");
    });
    it("should handle message change", () => {
        render(<MessageInput {...messageInputWithStringType} />);
        fireEvent.change(screen.getByRole("textbox"), {
            target: { value: "test update" },
        });
        expect(onMessageChange).toHaveBeenCalledWith({
            type: "string",
            content: "test update",
            useCarryover: false,
            context: {},
        });
    });
});
it("should render with null string content", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: null,
            context: {},
        } as WaldiezMessage,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
});
it("should render with null method content", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "method",
            useCarryover: false,
            content: null,
            context: {},
        } as WaldiezMessage,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
});
it("should handle method message change", async () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "method",
            useCarryover: false,
            content: "",
            context: {},
        } as WaldiezMessage,
    };
    render(<MessageInput {...customMessageInputProps} />);
    const editor = await screen.findByRole("textbox");
    expect(editor).toBeInTheDocument();
    fireEvent.change(editor, { target: { value: "test update" } });
    expect(onMessageChange).toHaveBeenCalledWith({
        type: "method",
        useCarryover: false,
        content: "test update",
        context: {},
    });
});
it("should include context", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
});
it("should add a context entry", () => {
    const addContextEntry = vi.fn();
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        onAddContextEntry: addContextEntry,
        includeContext: true,
    };
    render(<MessageInput {...customMessageInputProps} />);
    const addEntryInput = screen.getByTestId("new-dict-message-context-key");
    fireEvent.change(addEntryInput, { target: { value: "key2" } });
    const addValueInput = screen.getByTestId("new-dict-message-context-value");
    fireEvent.change(addValueInput, { target: { value: "value2" } });
    const addButton = screen.getByTestId("add-new-dict-message-context-item");
    fireEvent.click(addButton);
    expect(addContextEntry).toHaveBeenCalledWith("key2", "value2");
});
it("should remove a context entry", () => {
    const removeContextEntry = vi.fn();
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        onRemoveContextEntry: removeContextEntry,
        includeContext: true,
    };
    render(<MessageInput {...customMessageInputProps} />);
    const deleteButton = screen.getByTestId("delete-dict-item-message-context-0");
    fireEvent.click(deleteButton);
    expect(removeContextEntry).toHaveBeenCalledWith("key1");
});
it("should update context entries", () => {
    const updateContextEntries = vi.fn();
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        onUpdateContextEntries: updateContextEntries,
        includeContext: true,
    };
    render(<MessageInput {...customMessageInputProps} />);
    const keyInput = screen.getByTestId("key-input-message-context-0");
    fireEvent.change(keyInput, { target: { value: "key2" } });
    const saveButton = screen.getByTestId("save-dict-item-message-context-0");
    fireEvent.click(saveButton);
    expect(updateContextEntries).toHaveBeenCalledWith({ key2: "value1" });
});
it("should include rag option", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {},
        } as WaldiezMessage,
        skipRagOption: false,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
    const select = screen.getByRole("combobox");
    selectEvent.openMenu(select);
    expect(screen.getByText("Use RAG Message Generator")).toBeInTheDocument();
});
it("should skip rag option", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {},
        } as WaldiezMessage,
        skipRagOption: true,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
    const select = screen.getByRole("combobox");
    selectEvent.openMenu(select);
    expect(screen.queryByText("Use RAG Message Generator")).not.toBeInTheDocument();
});
it("should display and update the rag input", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "rag_message_generator",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        skipRagOption: false,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
    const problemTextarea = screen.getByTestId("rag-message-generator-problem");
    expect(problemTextarea).toBeInTheDocument();
    fireEvent.change(problemTextarea, { target: { value: "test update" } });
    expect(onMessageChange).toHaveBeenCalledWith({
        type: "rag_message_generator",
        content: null,
        useCarryover: false,
        context: {
            key1: "value1",
            problem: "test update",
        },
    });
});
it("should display and update the carryover input with type string", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "string",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        skipCarryoverOption: false,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
    const carryOverCheckbox = screen.getByTestId("message-use-carryover");
    expect(carryOverCheckbox).toBeInTheDocument();
    fireEvent.click(carryOverCheckbox);
    expect(onMessageChange).toHaveBeenCalledWith({
        type: "string",
        content: "",
        useCarryover: true,
        context: {
            key1: "value1",
        },
    });
});
it("should display and update the carryover input with type rag_message_generator", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "rag_message_generator",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        skipCarryoverOption: false,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
    const carryOverCheckbox = screen.getByTestId("message-use-carryover");
    expect(carryOverCheckbox).toBeInTheDocument();
    fireEvent.click(carryOverCheckbox);
    expect(onMessageChange).toHaveBeenCalledWith({
        type: "rag_message_generator",
        content: "",
        useCarryover: true,
        context: {
            key1: "value1",
        },
    });
});
it("should not display carryover input when type is method", () => {
    const customMessageInputProps = {
        ...messageInputProps,
        current: {
            type: "method",
            useCarryover: false,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        skipCarryoverOption: false,
    };
    const { baseElement } = render(<MessageInput {...customMessageInputProps} />);
    expect(baseElement).toBeTruthy();
    expect(screen.queryByTestId("last-carryover-checkbox")).not.toBeInTheDocument();
});

it("should display and update the rag input", () => {
    const onTypeChange = vi.fn();
    const onMessageChange = vi.fn();
    const messageInputProps = {
        current: {
            type: "rag_message_generator",
            useCarryover: true,
            content: "",
            context: {
                key1: "value1",
            },
        } as WaldiezMessage,
        defaultContent: "test",
        editorTheme: "test",
        selectLabel: "test",
        selectTestId: "test",
        onTypeChange,
        onMessageChange,
        notNoneLabelInfo: "test",
        includeContext: true,
        skipCarryoverOption: false,
        skipRagOption: false,
        darkMode: false,
    };
    const { baseElement } = render(<MessageInput {...messageInputProps} />);
    expect(baseElement).toBeTruthy();
    const problemTextarea = screen.getByTestId("rag-message-generator-problem");
    expect(problemTextarea).toBeInTheDocument();
    fireEvent.change(problemTextarea, { target: { value: "test update" } });
    expect(onMessageChange).toHaveBeenCalledWith({
        type: "rag_message_generator",
        content: null,
        context: {
            key1: "value1",
            problem: "test update",
        },
        useCarryover: true,
    });
});
