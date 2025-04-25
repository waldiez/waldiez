/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

// in case we are on node < 22 ?
// src, credits: https://github.com/wojtekmaj/react-pdf/issues/1811#issuecomment-2265067062

// @ts-expect-error This does not exist outside of polyfill which this is doing
if (typeof Promise.withResolvers === "undefined") {
    if (typeof window !== "undefined") {
        // @ts-expect-error This does not exist outside of polyfill which this is doing
        window.Promise.withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    } else {
        // @ts-expect-error This does not exist outside of polyfill which this is doing
        global.Promise.withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    }
}

export {};
