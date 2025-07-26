/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { memo } from "react";
import { FaInfoCircle } from "react-icons/fa";

import { CheckboxInput } from "@waldiez/components/checkboxInput";

type InfoCheckboxProps = {
    id: string; // Add id for the checkbox
    label: string | React.JSX.Element | (() => React.JSX.Element | string);
    info: string | React.JSX.Element | (() => React.JSX.Element | string);
    checked: boolean;
    onChange: (checked: boolean) => void; // Updated to match Radix checkbox API
};

export const InfoCheckbox: React.FC<InfoCheckboxProps> = memo((props: InfoCheckboxProps) => {
    const { id, label, info, checked, onChange } = props;

    const labelElement = typeof label === "function" ? label() : label;
    const infoElement = typeof info === "function" ? info() : info;
    return (
        <div className="info-checkbox-container">
            <div className="info-checkbox-wrapper">
                <CheckboxInput id={id} label={labelElement} isChecked={checked} onCheckedChange={onChange} />
                <div className="info-label margin-left--10">
                    <FaInfoCircle className="info-checkbox-icon" />
                    <div className="info-description">{infoElement}</div>
                </div>
            </div>
        </div>
    );
});

InfoCheckbox.displayName = "InfoCheckbox";
