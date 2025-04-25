/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

export type InfoLabelProps = {
    label: string | React.JSX.Element | (() => React.JSX.Element | string);
    info: string | React.JSX.Element | (() => React.JSX.Element | string);
};
