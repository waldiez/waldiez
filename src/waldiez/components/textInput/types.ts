/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

export type TextInputProps = {
    label: string | React.JSX.Element;
    value: string | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    onNull?: string;
    disabled?: boolean;
    labelInfo?: string | React.JSX.Element;
    dataTestId?: string;
    style?: React.CSSProperties;
    isPassword?: boolean;
    fullWidth?: boolean;
};
