/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type ChangeEvent, type FC, useCallback, useEffect, useMemo, useState } from "react";

import { CheckboxInput } from "@waldiez/components/checkboxInput";
import { ExpressionBuilder } from "@waldiez/components/expressionBuilder";
import { Select, type SingleValue } from "@waldiez/components/select";
import { type WaldiezHandoffAvailability } from "@waldiez/types";

const availabilityTypeOptions = [
    { value: "string", label: "Check a variable" },
    { value: "expression", label: "Use an expression" },
];

export const HandoffAvailability: FC<{
    available: WaldiezHandoffAvailability;
    contextVariables: string[];
    onDataChange: (condition: WaldiezHandoffAvailability) => void;
}> = props => {
    const { available, contextVariables, onDataChange } = props;

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

    const contextVariableOptions = useMemo(
        () => contextVariables.map(v => ({ value: v, label: v })),
        [contextVariables],
    );

    const selectedVariableOption = useMemo(
        () =>
            currentAvailability.type === "string" && currentAvailability.value
                ? {
                      value: currentAvailability.value,
                      label: currentAvailability.value,
                  }
                : null,
        [currentAvailability.type, currentAvailability.value],
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
        (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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
        <ExpressionBuilder
            value={currentAvailability.value || ""}
            onChange={expr => {
                const updatedAvailability: WaldiezHandoffAvailability = {
                    ...currentAvailability,
                    value: expr,
                };
                setCurrentAvailability(updatedAvailability);
                onDataChange(updatedAvailability);
            }}
            contextVariables={contextVariables}
            label="Expression"
            placeholder="Enter the expression to evaluate, e.g. ${is_logged_in} and not ${is_banned}"
        />
    );
    // Render string input
    const renderStringInput = () => (
        <div className="flex flex-col margin-top-10">
            <label className="hidden" htmlFor="availability-variable-select">
                Variable Name
            </label>
            {contextVariableOptions.length > 0 ? (
                <Select
                    options={contextVariableOptions}
                    value={selectedVariableOption}
                    onChange={option =>
                        onAvailabilityValueChange({
                            target: { value: option?.value ?? "" },
                        } as any)
                    }
                    className="flex-1"
                    placeholder="Select variable name"
                    inputId="availability-variable-select"
                    isClearable
                    data-testid="string-select"
                />
            ) : (
                <div className="info">
                    No context variables defined yet. Create context variables first to use this check.
                </div>
            )}
        </div>
    );
    return (
        <div className="flex flex-col">
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
            {currentAvailability.type !== "none" && (
                <div className="flex flex-col margin-top-10">
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
