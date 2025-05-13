/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useRef } from "react";

export const TextareaInput: React.FC<{
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    autoFocus?: boolean;
    [key: string]: any;
}> = ({
    value,
    onChange,
    autoFocus = false,
    ...props
}: {
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    autoFocus?: boolean;
    [key: string]: any;
}) => {
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
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
