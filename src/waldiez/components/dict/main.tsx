/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";
import { FaEye, FaEyeSlash, FaPlus, FaSave, FaTrash } from "react-icons/fa";

import { useDict } from "@waldiez/components/dict/hooks";
import type { DictProps } from "@waldiez/components/dict/types";
import { InfoLabel } from "@waldiez/components/infoLabel";

export const Dict: React.FC<DictProps> = (props: DictProps) => {
    const { viewLabel, viewLabelInfo, items, itemsType, areValuesSecret = false } = props;
    const {
        visible,
        newEntry,
        onAddEntry,
        onDeleteEntry,
        onSaveEntry,
        onKeyChange,
        onValueChange,
        onVisibilityChange,
        onNewEntryKeyChange,
        onNewEntryValueChange,
        isDirty,
    } = useDict(props);
    return (
        <div className="dict-entries-view">
            {viewLabelInfo ? (
                <InfoLabel htmlFor={`dict-entry-${itemsType}`} label={viewLabel} info={viewLabelInfo} />
            ) : (
                <label className={"margin-bottom-5"}>{viewLabel}</label>
            )}
            <div className="dict-entries-list">
                {Object.entries(items).map(([key, value], index) => (
                    <div className="dict-entry" key={key}>
                        <input
                            type="text"
                            key={`${key}-${value}-${index}`}
                            defaultValue={key}
                            onChange={onKeyChange.bind(null, index)}
                            data-testid={`key-input-${itemsType}-${index}`}
                            placeholder="Key"
                        />
                        <input
                            type={areValuesSecret ? (visible[key] ? "text" : "password") : "text"}
                            key={`${value}-${index}-${key}`}
                            defaultValue={String(value)}
                            onChange={onValueChange.bind(null, index)}
                            data-testid={`value-input-${itemsType}-${index}`}
                            id={`dict-value-input-${itemsType}-${index}`}
                            placeholder="Value"
                        />
                        {areValuesSecret && (
                            <button
                                type="button"
                                className="toggle-visibility-btn"
                                onClick={onVisibilityChange.bind(null, key)}
                                title="Toggle visibility"
                                id={`visibility-${itemsType}-${index}`}
                                data-testid={`visibility-${itemsType}-${index}`}
                            >
                                {visible[key] ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onDeleteEntry.bind(null, key)}
                            title="Delete"
                            className="trash-button"
                            id={`delete-dict-item-${itemsType}-${index}`}
                            data-testid={`delete-dict-item-${itemsType}-${index}`}
                        >
                            <FaTrash />
                        </button>
                        {isDirty(index) && (
                            <button
                                onClick={onSaveEntry}
                                title="Save"
                                id={`save-dict-item-${itemsType}-${index}`}
                                data-testid={`save-dict-item-${itemsType}-${index}`}
                                type="button"
                                className="save-button"
                            >
                                <FaSave />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="add-dict-entry-view">
                <input
                    type="text"
                    placeholder="Key"
                    data-testid={`new-dict-${itemsType}-key`}
                    id={`new-dict-${itemsType}-key`}
                    value={newEntry.key}
                    onChange={onNewEntryKeyChange}
                />
                <input
                    placeholder="Value"
                    data-testid={`new-dict-${itemsType}-value`}
                    id={`new-dict-${itemsType}-value`}
                    type={areValuesSecret ? (visible["_NEW"] ? "text" : "password") : "text"}
                    value={newEntry.value}
                    onChange={onNewEntryValueChange}
                />
                {areValuesSecret && (
                    <button
                        type="button"
                        className="toggle-visibility-btn"
                        onClick={onVisibilityChange.bind(null, "_NEW")}
                        title="Toggle visibility"
                        id={`visibility-${itemsType}-new`}
                        data-testid={`visibility-${itemsType}-new`}
                    >
                        {visible["_NEW"] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
                <button
                    onClick={onAddEntry}
                    title="Add"
                    className="plus-button"
                    id={`add-new-dict-${itemsType}-item`}
                    data-testid={`add-new-dict-${itemsType}-item`}
                    disabled={newEntry.key === ""}
                    type="button"
                >
                    <FaPlus />
                </button>
            </div>
        </div>
    );
};

Dict.displayName = "Dict";
