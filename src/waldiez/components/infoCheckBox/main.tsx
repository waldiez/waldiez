/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import * as Tooltip from "@radix-ui/react-tooltip";

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
                <Tooltip.Provider delayDuration={100}>
                    <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                            <button
                                type="button"
                                aria-label="More info"
                                className="tooltip-button inline-flex items-center justify-center cursor-help"
                            >
                                <FaInfoCircle />
                            </button>
                        </Tooltip.Trigger>

                        <Tooltip.Portal>
                            <Tooltip.Content
                                side="top"
                                align="center"
                                sideOffset={6}
                                collisionPadding={8}
                                className="tooltip-content"
                            >
                                {infoElement}
                                <Tooltip.Arrow className="fill-[var(--info-tooltip-bg)]" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>
                </Tooltip.Provider>
            </div>
        </div>
    );
});

InfoCheckbox.displayName = "InfoCheckbox";
