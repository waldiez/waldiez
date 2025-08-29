/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { CheckboxInput } from "@waldiez/components/checkboxInput";
import { Select, type SingleValue } from "@waldiez/components/select";
import { TextareaInput } from "@waldiez/components/textareaInput";
import { type WaldiezHandoffAvailability } from "@waldiez/types";

const availabilityTypeOptions = [
    { value: "string", label: "Check a variable" },
    { value: "expression", label: "Use an expression" },
];

export const HandoffAvailability: React.FC<{
    available: WaldiezHandoffAvailability;
    onDataChange: (condition: WaldiezHandoffAvailability) => void;
}> = props => {
    const { available, onDataChange } = props;

    // State
    const [currentAvailability, setCurrentAvailability] = useState<WaldiezHandoffAvailability>(available);

    // Sync with external condition changes
    useEffect(() => {
        setCurrentAvailability(available);
    }, [available]);

    const isExpressionType = useMemo(() => currentAvailability.type === "expression", [currentAvailability]);
    const isStringType = useMemo(() => currentAvailability.type === "string", [currentAvailability]);

    const selectedTypeOption = useMemo(
        () => availabilityTypeOptions.find(option => option.value === currentAvailability.type),
        [currentAvailability.type],
    );

    // Handler for availability type change
    const onAvailabilityTypeChange = useCallback(
        (checked: boolean) => {
            const newType = checked ? "string" : "none";
            const updatedAvailability: WaldiezHandoffAvailability = {
                ...currentAvailability,
                type: newType,
                value: currentAvailability.value, // Preserve existing value
            };
            setCurrentAvailability(updatedAvailability);
            onDataChange(updatedAvailability);
        },
        [currentAvailability, onDataChange],
    );
    // Handler for selected availability type change
    const onSelectedAvailabilityTypeChange = useCallback(
        (option: SingleValue<{ value: string; label: string }>) => {
            if (option) {
                const updatedAvailability: WaldiezHandoffAvailability = {
                    ...currentAvailability,
                    type: option.value as WaldiezHandoffAvailability["type"],
                    value: "", // Reset value when changing type
                };
                setCurrentAvailability(updatedAvailability);
                onDataChange(updatedAvailability);
            }
        },
        [currentAvailability, onDataChange],
    );
    // Handler for availability value change
    const onAvailabilityValueChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
            const updatedAvailability: WaldiezHandoffAvailability = {
                ...currentAvailability,
                value: event.target.value,
            };
            setCurrentAvailability(updatedAvailability);
            onDataChange(updatedAvailability);
        },
        [currentAvailability, onDataChange],
    );
    // Render expression input
    const renderExpressionInput = () => (
        <div className="flex-column margin-top-10">
            <label className="hidden" htmlFor="expression-input">
                Expression
            </label>
            <TextareaInput
                rows={2}
                className="margin-top-5"
                title="Expression"
                placeholder="Enter the expression to evaluate"
                value={currentAvailability.value || ""}
                onChange={onAvailabilityValueChange}
                data-testid="expression-input"
            />
        </div>
    );
    // Render string input
    const renderStringInput = () => (
        <div className="flex-column margin-top-10">
            <label className="hidden" htmlFor="string-input">
                Variable Name
            </label>
            <input
                type="text"
                id="string-input"
                value={currentAvailability.value}
                onChange={onAvailabilityValueChange}
                className="flex-1"
                placeholder="Enter variable name"
                data-testid="string-input"
            />
        </div>
    );
    return (
        <div className="flex-column">
            <div className="info margin-bottom-5">
                You can optionally handle the availability of this transition by checking a variable or using
                an expression.
                <ul>
                    <li>
                        <strong>Check a variable</strong>: Confirm if a certain variable (like{" "}
                        <code>order_is_found</code>) is set and is truthy.
                    </li>
                    <li>
                        <strong>Use Expression</strong>: Write a short logic rule using variables, like:
                        <br />
                        <code>
                            ${"{"}is_logged_in{"}"} and not ${"{"}is_banned{"}"}
                        </code>
                    </li>
                </ul>
            </div>
            <div>
                <CheckboxInput
                    label="Enable Availability Check"
                    isChecked={currentAvailability.type !== "none"}
                    onCheckedChange={onAvailabilityTypeChange}
                    id="availability-enabled-checkbox"
                    data-testid="availability-enabled-checkbox"
                    aria-label="Enable availability check"
                />
            </div>
            {available.type !== "none" && (
                <div className="flex-column margin-top-10">
                    <label className="hidden" htmlFor="select-availability-type">
                        Availability Type
                    </label>
                    <Select
                        options={availabilityTypeOptions}
                        value={selectedTypeOption}
                        onChange={onSelectedAvailabilityTypeChange}
                        inputId="select-availability-type"
                        className="flex-1 margin-right-10"
                        isClearable
                        data-testid="availability-type-select"
                    />
                    {isExpressionType && renderExpressionInput()}
                    {isStringType && renderStringInput()}
                </div>
            )}
        </div>
    );
};

HandoffAvailability.displayName = "HandoffAvailability";
