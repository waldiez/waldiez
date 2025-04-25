/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ChangeEvent } from "react";

export type InfoCheckboxProps = {
    label: string | React.JSX.Element | (() => React.JSX.Element | string);
    info: string | React.JSX.Element | (() => React.JSX.Element | string);
    checked: boolean;
    dataTestId: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};
