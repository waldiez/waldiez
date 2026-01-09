/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type ChangeEvent, type FC, useCallback, useEffect, useRef } from "react";

export const TextareaInput: FC<{
    value: string | undefined;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    autoFocus?: boolean;
    [key: string]: any; // Allow other props like className, style, etc.
}> = ({ value, onChange, autoFocus = false, ...props }) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const cursorPositionRef = useRef<{
        selectionStart: number;
        selectionEnd: number;
    }>({
        selectionStart: value?.length || 0,
        selectionEnd: value?.length || 0,
    });

    // Track if this is the first render
    const isFirstRender = useRef(true);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            const { selectionStart, selectionEnd } = e.target;
            cursorPositionRef.current = { selectionStart, selectionEnd };
            onChange(e);
        },
        [onChange],
    );

    // Auto-focus only when requested
    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();
        }
    }, [autoFocus]);

    // Set the cursor position after the value is updated
    useEffect(() => {
        // Skip on first render to avoid interfering with default cursor positioning
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (ref.current && document.activeElement === ref.current) {
            // Only restore position if the textarea is focused
            requestAnimationFrame(() => {
                if (ref.current) {
                    ref.current.setSelectionRange(
                        cursorPositionRef.current.selectionStart,
                        cursorPositionRef.current.selectionEnd,
                    );
                }
            });
        }
    }, [value]);

    return <textarea ref={ref} value={value} onChange={handleChange} {...props} />;
};

TextareaInput.displayName = "TextareaInput";
