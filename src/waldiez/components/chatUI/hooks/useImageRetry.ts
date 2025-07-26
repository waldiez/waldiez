/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useRef } from "react";

export const useImageRetry = (maxRetries = 3, retryDelay = 1000) => {
    const retries = useRef(new Map<string, number>());

    const registerImage = useCallback(
        (img: HTMLImageElement, url: string) => {
            const handleLoad = () => {
                img.classList.remove("loading", "failed");
                img.style.opacity = "1";
                retries.current.delete(url);
            };

            const handleError = () => {
                const retryCount = retries.current.get(url) || 0;
                if (retryCount < maxRetries) {
                    retries.current.set(url, retryCount + 1);
                    setTimeout(() => {
                        img.src = `${url}${url.includes("?") ? "&" : "?"}retry=${retryCount + 1}`;
                    }, retryDelay);
                } else {
                    img.classList.remove("loading");
                    img.classList.add("failed");
                    img.style.opacity = "0.8";
                }
            };

            img.onload = handleLoad;
            img.onerror = handleError;
        },
        [maxRetries, retryDelay],
    );

    const resetRetries = useCallback(() => {
        retries.current.clear();
    }, []);

    return { registerImage, resetRetries };
};
