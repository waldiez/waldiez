/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import * as Tooltip from "@radix-ui/react-tooltip";

import { type FC, type JSX, type ReactNode } from "react";
import { FaInfoCircle } from "react-icons/fa";

type InfoLabelProps = {
    htmlFor: string;
    label: string | JSX.Element | (() => JSX.Element | string);
    info: string | JSX.Element | (() => JSX.Element | string);
    children?: ReactNode;
};

export const InfoLabel: FC<InfoLabelProps> = ({ htmlFor, label, info, children }) => {
    const labelElement = typeof label === "function" ? label() : label;
    const infoElement = typeof info === "function" ? info() : info;

    return (
        <div className="flex-align-center flex-row gap-1">
            <div className="flex-align-center items-center gap-2">
                <label htmlFor={htmlFor} className="text-sm info-label">
                    {labelElement}
                </label>

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
                            <Tooltip.Content side="top" align="center" className="tooltip-content">
                                {infoElement}
                                <Tooltip.Arrow className="fill-[var(--background-color)]" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    </Tooltip.Root>
                </Tooltip.Provider>
            </div>
            {children && <div>{children}</div>}
        </div>
    );
};

InfoLabel.displayName = "InfoLabel";
