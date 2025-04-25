/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaPlus, FaTrash } from "react-icons/fa";

import { InfoLabel } from "@waldiez/components/infoLabel";
import { useStringList } from "@waldiez/components/stringList/hooks";
import { StringListProps } from "@waldiez/components/stringList/types";

export const StringList = (props: StringListProps) => {
    const { viewLabel, viewLabelInfo, items, itemsType } = props;
    const placeholder = props.placeholder || "...";
    const { newEntry, onAddEntry, onDeleteEntry, onEntryChange, onNewEntryChange } = useStringList(props);
    const labelElement = typeof viewLabel === "function" ? viewLabel() : viewLabel;
    return (
        <div className="list-entries-view">
            {viewLabelInfo ? (
                <InfoLabel label={viewLabel} info={viewLabelInfo} />
            ) : (
                <label className="list-entries-label">{labelElement}</label>
            )}

            <div className="list-entries-list">
                {items?.map((item, index) => (
                    <div className="list-entry" key={index}>
                        <input
                            placeholder={placeholder}
                            type="text"
                            value={item}
                            data-value={item}
                            onChange={onEntryChange}
                            data-testid={`list-entry-item-${itemsType}-${index}`}
                        />
                        <button
                            type="button"
                            onClick={onDeleteEntry}
                            value={item}
                            title="Delete"
                            data-testid={`delete-list-entry-${itemsType}-${index}`}
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>
            <div className="add-list-entry-view">
                <input
                    placeholder={placeholder}
                    type="text"
                    value={newEntry}
                    onChange={onNewEntryChange}
                    data-testid={`new-list-entry-${itemsType}-item`}
                />
                <button
                    type="button"
                    onClick={onAddEntry}
                    title="Add"
                    data-testid={`add-list-entry-${itemsType}-button`}
                >
                    <FaPlus />
                </button>
            </div>
        </div>
    );
};
