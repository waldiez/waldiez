/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

type Axis = "w" | "h";

export type CSSSize =
    | number
    | `${number}px`
    | `${number}%`
    | `${number}vw`
    | `${number}vh`
    | "auto"
    | undefined;

// eslint-disable-next-line max-statements
export const toPixels = (val: CSSSize, axis: Axis, iw: number, ih: number): number | undefined => {
    if (val === undefined || val === "auto") {
        return undefined;
    }
    if (typeof val === "number") {
        return val;
    }

    const s = String(val).trim().toLowerCase();
    const num = parseFloat(s);

    if (Number.isNaN(num)) {
        return undefined;
    }

    if (s.endsWith("px") || /^[0-9.]+$/.test(s)) {
        return num;
    }
    if (s.endsWith("vw")) {
        return (num / 100) * iw;
    }
    if (s.endsWith("vh")) {
        return (num / 100) * ih;
    }
    if (s.endsWith("%")) {
        return (num / 100) * (axis === "w" ? iw : ih);
    }

    // Unsupported unit -> undefined (treated as no restriction)
    return undefined;
};

export const clampOpt = (v: number, min?: number, max?: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, v));
