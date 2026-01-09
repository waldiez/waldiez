/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dict } from "@waldiez/components/dict";

const onAdd = vi.fn();
const onDelete = vi.fn();
const onUpdate = vi.fn();

const renderDict = (overrides: { [key: string]: any } = {}, valuesAreSecrets: boolean = false) => {
    const dictData = {
        testKey: "testValue",
        testKey2: "testValue2",
    };
    const dictProps = {
        viewLabel: "test",
        items: dictData,
        itemsType: "test",
        areValuesSecret: valuesAreSecrets,
        onAdd,
        onDelete,
        onUpdate,
        ...overrides,
    };
    return render(<Dict {...dictProps} />);
};

describe("Dict", () => {
    afterEach(() => {
        onAdd.mockClear();
        onDelete.mockClear();
        onUpdate.mockClear();
    });
    it("should render successfully", () => {
        const { baseElement } = renderDict();
        expect(baseElement).toBeTruthy();
    });

    it("should handle key change", () => {
        renderDict({ items: { testKey: "testValue", testKey2: "testValue2" } });
        const keyInput = screen.getByTestId("key-input-test-0") as HTMLInputElement;
        expect(keyInput).toBeTruthy();
        // user types in new key
        fireEvent.change(keyInput, { target: { value: "newKey" } });
        const saveButton = screen.getByTitle("Save");
        fireEvent.click(saveButton);
        expect(onUpdate).toHaveBeenCalledWith({
            newKey: "testValue",
            testKey2: "testValue2",
        });
    });

    it("should handle value change", () => {
        renderDict({ items: { testKey: "testValue", testKey2: "testValue2" } });
        const valueInput = screen.getByTestId("value-input-test-0") as HTMLInputElement;
        expect(valueInput).toBeTruthy();
        // user types in new value
        fireEvent.change(valueInput, { target: { value: "newValue" } });
        const saveButton = screen.getByTitle("Save");
        fireEvent.click(saveButton);
        expect(onUpdate).toHaveBeenCalledWith({
            testKey: "newValue",
            testKey2: "testValue2",
        });
    });

    it("should handle delete", () => {
        renderDict({
            items: {
                testKey: "testValue",
                testKey2: "testValue2",
                testKey3: "testValue3",
            },
        });
        const deleteButton = screen.getByTestId("delete-dict-item-test-1");
        fireEvent.click(deleteButton);
        expect(onDelete).toHaveBeenCalledWith("testKey2");
    });

    it("should handle add", () => {
        renderDict({
            items: {
                testKey: "testValue",
                testKey2: "testValue2",
                testKey3: "testValue3",
            },
        });
        const keyInput = screen.getByTestId("new-dict-test-key") as HTMLInputElement;
        expect(keyInput).toBeTruthy();
        // user types in new key
        fireEvent.change(keyInput, { target: { value: "newKey" } });
        const valueInput = screen.getByTestId("new-dict-test-value") as HTMLInputElement;
        expect(valueInput).toBeTruthy();
        // user types in new value
        fireEvent.change(valueInput, { target: { value: "newValue" } });
        const addButton = screen.getByTitle("Add");
        fireEvent.click(addButton);
        expect(onAdd).toHaveBeenCalledWith("newKey", "newValue");
    });

    it("should handle visibility change", () => {
        renderDict(
            {
                items: {
                    testKey: "testValue",
                },
            },
            true,
        );
        const secretValueInput = screen.getByTestId("value-input-test-0") as HTMLInputElement;
        expect(secretValueInput).toBeTruthy();
        expect(secretValueInput.type).toBe("password");
        const visibilityButton = screen.getByTestId("visibility-test-0");
        fireEvent.click(visibilityButton);
        expect(visibilityButton).toBeTruthy();
        expect(secretValueInput.type).toBe("text");
        const newInput = screen.getByTestId("new-dict-test-value") as HTMLInputElement;
        expect(newInput).toBeTruthy();
        expect(newInput.type).toBe("password");
        const newVisibilityButton = screen.getByTestId("visibility-test-new");
        fireEvent.click(newVisibilityButton);
        expect(newVisibilityButton).toBeTruthy();
        expect(newInput.type).toBe("text");
    });
});
