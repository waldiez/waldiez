/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import * as Checkbox from "@radix-ui/react-checkbox";

import React, { memo } from "react";

export const CheckboxInput: React.FC<{
    id: string;
    label: string | React.JSX.Element;
    isChecked: boolean;
    onCheckedChange: (checked: boolean) => void;
}> = memo(({ id, label, isChecked, onCheckedChange }) => {
    const ariaLabel = typeof label === "string" ? label : "Label for checkbox";
    return (
        <div className="flex" data-testid={`checkbox-input-container-${id}`}>
            <Checkbox.Root
                className="checkbox-root"
                id={`checkbox-input-${id}`}
                checked={isChecked}
                onCheckedChange={onCheckedChange}
                data-testid={id}
                aria-label={ariaLabel}
            >
                <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
            </Checkbox.Root>
            <label
                className="clickable no-padding padding-10"
                style={{ width: "max-content" }}
                htmlFor={`checkbox-input-${id}`}
            >
                {label}
            </label>
        </div>
    );
});
