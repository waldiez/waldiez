/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

export type NumberInputProps = {
    label: string | React.JSX.Element;
    value: number | null;
    min: number;
    max: number;
    onChange: (value: number | null) => void;
    forceInt?: boolean;
    onNull?: number;
    onUpperLabel?: string | null;
    onLowerLabel?: string | null;
    setNullOnUpper?: boolean;
    setNullOnLower?: boolean;
    step?: number;
    stepDownScale?: number;
    disabled?: boolean;
    labelInfo?: string | React.JSX.Element | null;
    dataTestId?: string;
};
