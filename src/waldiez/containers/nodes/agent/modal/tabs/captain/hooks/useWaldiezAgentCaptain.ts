/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useState } from "react";

import { WaldiezAgentCaptainTabProps } from "@waldiez/containers/nodes/agent/modal/tabs/captain/types";
import { WaldiezCaptainAgentLibEntry } from "@waldiez/models/Agent/Captain";

/**
 * Custom hook for managing Waldiez Captain Agent functionality
 * Handles agent library settings, configuration, and file uploads
 */
export const useWaldiezAgentCaptain = (props: WaldiezAgentCaptainTabProps) => {
    const { data, onDataChange } = props;

    // Local state
    const [enableAgentLib, setEnableAgentLib] = useState(data.agentLib.length > 0);
    const [agentLib, setAgentLib] = useState<WaldiezCaptainAgentLibEntry[]>(data.agentLib);

    /**
     * Sync local state with props when data changes
     */
    useEffect(() => {
        // setEnableAgentLib(data.agentLib.length > 0);
        setAgentLib(data.agentLib);
    }, [data]);

    /**
     * Generic handler for updating state and propagating changes
     */
    const onChange = useCallback(
        (partialData: Partial<typeof data>) => {
            onDataChange({
                ...partialData,
            });
        },
        [onDataChange],
    );

    /**
     * Handle max round setting changes
     */
    const onMaxRoundChange = useCallback(
        (value: number | null) => {
            if (typeof value === "number") {
                onChange({
                    maxRound: value,
                });
            }
        },
        [onChange],
    );

    /**
     * Handle tool library toggle
     */
    const onToolLibChange = useCallback(
        (checked: boolean) => {
            onChange({
                toolLib: checked ? "default" : null,
            });
        },
        [onChange],
    );

    /**
     * Handle agent library toggle
     */
    const onEnableAgentLibChange = useCallback(
        (checked: boolean) => {
            setEnableAgentLib(checked);

            if (!checked) {
                onChange({
                    agentLib: [],
                });
            } else {
                onChange({
                    agentLib,
                });
            }
        },
        [onChange, agentLib],
    );

    /**
     * Parse agent library JSON data
     */
    const parseAgentLibList = useCallback((result: object): WaldiezCaptainAgentLibEntry[] => {
        const parsedAgentLib: WaldiezCaptainAgentLibEntry[] = [];

        if (Array.isArray(result)) {
            for (const entry of result) {
                if (typeof entry === "object" && entry !== null) {
                    const { name, description } = entry as Record<string, unknown>;

                    if (typeof name === "string" && typeof description === "string") {
                        // Handle either systemMessage or system_message property
                        const entryObject = entry as Record<string, unknown>;
                        const systemMessage =
                            typeof entryObject.systemMessage === "string"
                                ? entryObject.systemMessage
                                : typeof entryObject.system_message === "string"
                                  ? entryObject.system_message
                                  : null;

                        // eslint-disable-next-line max-depth
                        if (systemMessage) {
                            parsedAgentLib.push({
                                name,
                                description,
                                systemMessage,
                            });
                        }
                    }
                }
            }
        }

        return parsedAgentLib;
    }, []);

    /**
     * Handle file upload for agent library
     */
    const onFileUpload = useCallback(
        (files: File[]) => {
            if (!files.length) {
                return;
            }

            const file = files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const result = reader.result as string;
                    const parsedResult = JSON.parse(result);
                    const parsedAgentLib = parseAgentLibList(parsedResult);

                    setAgentLib(parsedAgentLib);
                    onChange({
                        agentLib: parsedAgentLib,
                    });
                } catch (error) {
                    console.error("Failed to parse agent library file:", error);
                    // Could add error handling UI feedback here
                }
            };

            reader.readAsText(file);
        },
        [onChange, parseAgentLibList],
    );

    return {
        agentLib,
        enableAgentLib,
        onEnableAgentLibChange,
        onFileUpload,
        onMaxRoundChange,
        // onMaxTurnsChange,
        onToolLibChange,
    };
};
