/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback, useEffect, useRef, useState } from "react";

import { _registerSnackbarEnqueue, _unregisterSnackbarEnqueue } from "@waldiez/components/snackbar/compat";
import { SnackbarContext } from "@waldiez/components/snackbar/context";
import { Snackbar } from "@waldiez/components/snackbar/snackbar";
import type { ShowSnackbarProps, SnackbarItem, SnackbarQueue } from "@waldiez/components/snackbar/types";

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Queues per flowId
    const [queues, setQueues] = useState<Record<string, SnackbarQueue>>({});
    // Current displayed snackbar per flowId
    const [active, setActive] = useState<Record<string, SnackbarItem | null>>({});

    const timeouts = useRef<Record<string, number>>({});

    // Enqueue a snackbar, queue by flowId
    const enqueueSnackbar = useCallback((props: ShowSnackbarProps) => {
        setQueues(qs => {
            const id = Math.random().toString(36).slice(2);
            const flowId = props.flowId || "default"; // Default flowId if not provided
            return {
                ...qs,
                [flowId]: [...(qs[flowId] ?? []), { ...props, id }],
            };
        });
    }, []);

    // Register global compat API
    useEffect(() => {
        _registerSnackbarEnqueue(enqueueSnackbar);
        return () => _unregisterSnackbarEnqueue();
    }, [enqueueSnackbar]);

    // Show next snackbar for each flow
    useEffect(() => {
        Object.keys(queues).forEach(flowId => {
            if (!active[flowId] && queues[flowId] && queues[flowId].length > 0) {
                setActive(a => ({ ...a, [flowId]: queues[flowId]?.[0] ?? null }));
                setQueues(qs => ({
                    ...qs,
                    [flowId]: qs[flowId]?.slice(1) ?? [],
                }));
            }
        });
    }, [queues, active]);

    const handleClose = useCallback((flowId: string) => {
        setActive(a => ({ ...a, [flowId]: null }));
    }, []);

    // Auto-dismiss logic per flowId
    useEffect(() => {
        Object.entries(active).forEach(([flowId, snackbar]) => {
            if (!snackbar) {
                return;
            }
            const { duration, withCloseButton } = snackbar;
            if (!withCloseButton || duration !== undefined) {
                if (timeouts.current[flowId]) {
                    clearTimeout(timeouts.current[flowId]);
                }
                timeouts.current[flowId] = window.setTimeout(() => {
                    handleClose(flowId);
                }, duration ?? 3000);
            }
        });
        return () => {
            Object.values(timeouts.current).forEach(clearTimeout);
            timeouts.current = {};
        };
    }, [active, handleClose]);

    // Renders snackbars into their appropriate flow-root, fallback to body
    return (
        <SnackbarContext.Provider value={{ enqueueSnackbar }}>
            {children}
            {Object.entries(active).map(([flowId, snackbar]) =>
                snackbar ? (
                    <Snackbar key={snackbar.id} {...snackbar} onClose={() => handleClose(flowId)} />
                ) : null,
            )}
        </SnackbarContext.Provider>
    );
};
