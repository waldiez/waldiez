/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export type StepRunModalProps = {
    flowId: string;
    darkMode: boolean;
    onClose: () => void;
    onStart: (breakpoints: string[], checkpoint?: string | null) => void;
    getCheckpoints?: () => Promise<Record<string, any> | null>;
    setCheckpoint?: (checkpoint: Record<string, any>) => Promise<void>;
};

export type Checkpoint = {
    id: string;
    history: Array<{
        timestamp: string;
        state: {
            messages: any[];
            context_variables: Record<string, any>;
        };
        metadata?: any;
    }>;
};
