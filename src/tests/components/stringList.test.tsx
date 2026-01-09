/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StringList } from "@waldiez/components/stringList";

describe("StringList", () => {
    it("should render successfully", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            items: ["test"],
            itemsType: "test",
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        const { baseElement } = render(<StringList {...stringListProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with viewLabel as JSX.Element", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: <div>test</div>,
            items: ["test"],
            itemsType: "test",
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        const { baseElement } = render(<StringList {...stringListProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with viewLabel as function", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: () => <div>test</div>,
            items: ["test"],
            itemsType: "test",
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        const { baseElement } = render(<StringList {...stringListProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should render with info label", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            viewLabelInfo: "info",
            items: ["test"],
            itemsType: "test",
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        const { baseElement } = render(<StringList {...stringListProps} />);
        expect(baseElement).toBeTruthy();
    });

    it("should handle item change", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            items: ["test", "test2"],
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        render(
            <StringList
                items={stringListProps.items}
                itemsType="test"
                viewLabel={stringListProps.viewLabel}
                onItemAdded={stringListProps.onItemAdded}
                onItemChange={stringListProps.onItemChange}
                onItemDeleted={stringListProps.onItemDeleted}
            />,
        );
        const itemInput = screen.getByTestId("list-entry-item-test-0") as HTMLInputElement;
        expect(itemInput).toBeTruthy();
        // user types in new item
        fireEvent.change(itemInput, { target: { value: "newItem" } });
        expect(onItemChange).toHaveBeenCalledWith("test", "newItem");
    });

    it("should handle item delete", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            items: ["test", "test2"],
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        render(
            <StringList
                items={stringListProps.items}
                itemsType="test"
                viewLabel={stringListProps.viewLabel}
                onItemAdded={stringListProps.onItemAdded}
                onItemChange={stringListProps.onItemChange}
                onItemDeleted={stringListProps.onItemDeleted}
            />,
        );
        const deleteButton = screen.getByTestId("delete-list-entry-test-1");
        expect(deleteButton).toBeTruthy();
        fireEvent.click(deleteButton);
        expect(onItemDeleted).toHaveBeenCalledWith("test2");
    });

    it("should handle item add", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            items: ["test", "test2"],
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        render(
            <StringList
                items={stringListProps.items}
                itemsType="test"
                viewLabel={stringListProps.viewLabel}
                onItemAdded={stringListProps.onItemAdded}
                onItemChange={stringListProps.onItemChange}
                onItemDeleted={stringListProps.onItemDeleted}
            />,
        );
        const newEntryInput = screen.getByTestId("new-list-entry-test-item");
        expect(newEntryInput).toBeTruthy();
        fireEvent.change(newEntryInput, { target: { value: "newItem" } });
        const addButton = screen.getByTitle("Add");
        fireEvent.click(addButton);
        expect(onItemAdded).toHaveBeenCalledWith("newItem");
    });
    it("should not add empty item", () => {
        const onItemAdded = vi.fn();
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            items: ["test", "test2"],
            onItemAdded,
            onItemChange,
            onItemDeleted,
        };
        render(
            <StringList
                items={stringListProps.items}
                itemsType="test"
                viewLabel={stringListProps.viewLabel}
                onItemAdded={stringListProps.onItemAdded}
                onItemChange={stringListProps.onItemChange}
                onItemDeleted={stringListProps.onItemDeleted}
            />,
        );
        const addButton = screen.getByTitle("Add");
        fireEvent.click(addButton);
        expect(onItemAdded).not.toHaveBeenCalled();
    });
    it("should not add an item if not onItemAdded is passed", () => {
        const onItemChange = vi.fn();
        const onItemDeleted = vi.fn();
        const stringListProps = {
            viewLabel: "test",
            items: ["test", "test2"],
            onItemChange,
            onItemDeleted,
        };
        render(
            <StringList
                items={stringListProps.items}
                itemsType="test"
                viewLabel={stringListProps.viewLabel}
                onItemChange={stringListProps.onItemChange}
                onItemDeleted={stringListProps.onItemDeleted}
            />,
        );
        const newEntryInput = screen.getByTestId("new-list-entry-test-item");
        expect(newEntryInput).toBeTruthy();
        fireEvent.change(newEntryInput, { target: { value: "newItem" } });
        const addButton = screen.getByTitle("Add");
        fireEvent.click(addButton);
        expect(onItemChange).not.toHaveBeenCalled();
    });
});
