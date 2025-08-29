/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

import { InfoLabel } from "@waldiez/components/infoLabel";
import { useStringList } from "@waldiez/components/stringList/hooks";
import type { StringListProps } from "@waldiez/components/stringList/types";

/**
 * Component for displaying and managing a list of string values
 */
export const StringList = memo<StringListProps>((props: StringListProps) => {
    const { viewLabel, viewLabelInfo, items = [], itemsType = "default", placeholder = "..." } = props;

    // Use custom hook for string list functionality
    const { newEntry, onAddEntry, onDeleteEntry, onEntryChange, onNewEntryChange, onNewEntryKeyDown } =
        useStringList(props);

    // Prepare label element
    const labelElement = useMemo(
        () => (typeof viewLabel === "function" ? viewLabel() : viewLabel),
        [viewLabel],
    );

    // Render list items
    const renderItems = useMemo(
        () =>
            items.map((item, index) => {
                return (
                    <div className="list-entry" key={`${itemsType}-${index}`}>
                        <input
                            placeholder={placeholder}
                            type="text"
                            value={item}
                            data-index={index}
                            id={`list-entry-item-${itemsType}-${index}`}
                            onChange={onEntryChange}
                            data-testid={`list-entry-item-${itemsType}-${index}`}
                        />
                        <button
                            type="button"
                            onClick={onDeleteEntry}
                            value={item}
                            title="Delete"
                            className="trash-button"
                            id={`delete-list-entry-${itemsType}-${index}`}
                            aria-label={`Delete item: ${item}`}
                            data-testid={`delete-list-entry-${itemsType}-${index}`}
                        >
                            <FaTrash />
                        </button>
                    </div>
                );
            }),
        [items, itemsType, placeholder, onEntryChange, onDeleteEntry],
    );

    // Determine if add button should be disabled
    const isAddDisabled = !newEntry.trim();

    return (
        <div className="list-entries-view">
            {viewLabelInfo ? (
                <InfoLabel label={viewLabel} info={viewLabelInfo} htmlFor="list-entries" />
            ) : (
                <label className="list-entries-label" htmlFor="list-entries">
                    {labelElement}
                </label>
            )}

            {items.length > 0 && <div className="list-entries-list">{renderItems}</div>}

            <div className="list-entries-list">
                <div className="add-list-entry-view">
                    <input
                        placeholder={placeholder}
                        type="text"
                        value={newEntry}
                        onChange={onNewEntryChange}
                        onKeyDown={onNewEntryKeyDown}
                        data-testid={`new-list-entry-${itemsType}-item`}
                        aria-label={`New ${itemsType} input`}
                        id={`new-list-entry-${itemsType}`}
                    />
                    <button
                        type="button"
                        onClick={onAddEntry}
                        title="Add"
                        disabled={isAddDisabled}
                        className="plus-button"
                        aria-label="Add item"
                        id={`add-list-entry-${itemsType}-button`}
                        data-testid={`add-list-entry-${itemsType}-button`}
                    >
                        <FaPlus />
                    </button>
                </div>
            </div>
        </div>
    );
});

StringList.displayName = "StringList";
