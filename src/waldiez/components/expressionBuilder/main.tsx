/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type FC, useCallback, useEffect, useMemo, useState } from "react";

import { CheckboxInput } from "@waldiez/components/checkboxInput";
import { Select, type SingleValue } from "@waldiez/components/select";
import { TextInput } from "@waldiez/components/textInput";
import { TextareaInput } from "@waldiez/components/textareaInput";

const expressionOperators = ["==", "!=", ">", ">=", "<", "<="] as const;
const reMatch = /^\$\{([^}]+)\}\s*(==|!=|>=|<=|>|<)\s*(.+)$/;

type Operator = (typeof expressionOperators)[number];

type Option = { value: string; label: string };

export type ExpressionBuilderProps = {
    value: string;
    onChange: (value: string) => void;
    contextVariables: string[];
    label?: string;
    placeholder?: string;
    /** Start in advanced (free-form) mode */
    defaultAdvanced?: boolean;
};

export const ExpressionBuilder: FC<ExpressionBuilderProps> = ({
    value,
    onChange,
    contextVariables,
    label = "Expression",
    placeholder = "Enter an expression, e.g. ${orders} > 3",
    defaultAdvanced = false,
}) => {
    const [isAdvanced, setIsAdvanced] = useState(defaultAdvanced);
    const [exprVariable, setExprVariable] = useState("");
    const [exprOperator, setExprOperator] = useState<Operator>("==");
    const [exprValue, setExprValue] = useState("");

    const contextVariableOptions = useMemo(
        () => contextVariables.map(v => ({ value: v, label: v })),
        [contextVariables],
    );

    const operatorOptions = useMemo(() => expressionOperators.map(op => ({ value: op, label: op })), []);

    const buildExpression = useCallback((variable: string, op: Operator, val: string) => {
        if (!variable || !op) {
            return val || "";
        }
        return `\${${variable}} ${op} ${val}`;
    }, []);

    // Initialize builder fields from incoming value (if it matches `${var} op const`)
    useEffect(() => {
        if (isAdvanced) {
            return;
        }
        if (exprVariable || exprValue) {
            // User already started editing via builder; don't override
            return;
        }

        const raw = value.trim();
        const match = raw.match(reMatch);
        if (match) {
            setExprVariable(match[1] || "");
            setExprOperator(match[2] as Operator);
            setExprValue(match[3] || "");
        }
    }, [value, isAdvanced, exprVariable, exprValue]);

    // Handlers (builder mode)
    const handleVariableChange = useCallback(
        (option: SingleValue<Option>) => {
            const variable = option?.value ?? "";
            setExprVariable(variable);
            const expr = buildExpression(variable, exprOperator, exprValue);
            onChange(expr);
        },
        [buildExpression, exprOperator, exprValue, onChange],
    );

    const handleOperatorChange = useCallback(
        (option: SingleValue<Option>) => {
            const op = (option?.value as Operator) ?? "==";
            setExprOperator(op);
            const expr = buildExpression(exprVariable, op, exprValue);
            onChange(expr);
        },
        [buildExpression, exprVariable, exprValue, onChange],
    );

    const handleValueChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setExprValue(val);
            const expr = buildExpression(exprVariable, exprOperator, val);
            onChange(expr);
        },
        [buildExpression, exprOperator, exprVariable, onChange],
    );

    // Handler (advanced mode)
    const handleFreeFormChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value);
        },
        [onChange],
    );

    const toggleAdvanced = useCallback(
        (checked: boolean) => {
            setIsAdvanced(checked);
            // When switching from advanced -> builder, try to parse current value
            if (!checked) {
                const raw = value.trim();
                const match = raw.match(reMatch);
                if (match) {
                    setExprVariable(match[1] || "");
                    setExprOperator(match[2] as Operator);
                    setExprValue(match[3] || "");
                } else {
                    setExprVariable("");
                    setExprOperator("==" as Operator);
                    setExprValue("");
                }
            }
        },
        [value],
    );

    return (
        <div className="flex flex-col margin-top-10">
            <label>{label}</label>

            <div className="margin-top-5" />
            <CheckboxInput
                id="toggle-free-form-expression-mode"
                label={"Use advanced free-form expression"}
                isChecked={isAdvanced}
                onCheckedChange={checked => toggleAdvanced(checked)}
            />

            {!isAdvanced && (
                <div className="margin-top-10">
                    <div className="flex gap-5">
                        <div className="flex-1">
                            <div className="margin-bottom-5">Context variable</div>
                            <label className="hidden" htmlFor="expression-variable-select">
                                Context variable
                            </label>
                            <Select
                                options={contextVariableOptions}
                                value={exprVariable ? { value: exprVariable, label: exprVariable } : null}
                                onChange={handleVariableChange}
                                isClearable
                                placeholder="Select variable"
                                inputId="expression-variable-select"
                            />
                        </div>
                        <div className="min-w-24">
                            <div className="margin-bottom-5">Operator</div>
                            <label className="hidden" htmlFor="expression-operator-select">
                                Operator
                            </label>
                            <Select
                                options={operatorOptions}
                                value={{
                                    value: exprOperator,
                                    label: exprOperator,
                                }}
                                onChange={handleOperatorChange}
                                isClearable={false}
                                inputId="expression-operator-select"
                            />
                        </div>
                        <div className="flex-1">
                            <TextInput
                                name="expression-constant"
                                label="Value"
                                className="margin-bottom-0"
                                placeholder="Enter the value to compare with"
                                value={exprValue}
                                onChange={handleValueChange}
                                dataTestId="expression-constant-input"
                            />
                        </div>
                    </div>

                    <div className="info margin-top-5">
                        Preview:&nbsp;
                        <code>{value || "Select a variable and define the expression"}</code>
                    </div>
                </div>
            )}

            {isAdvanced && (
                <div className="margin-top-10">
                    <TextareaInput
                        rows={3}
                        className="margin-top-5"
                        title={label}
                        placeholder={placeholder}
                        value={value}
                        onChange={handleFreeFormChange}
                        data-testid="expression-input"
                    />
                </div>
            )}
        </div>
    );
};

ExpressionBuilder.displayName = "ExpressionBuilder";
