/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { WaldiezAgentCaptainTabProps } from "@waldiez/containers/nodes/agent/modal/tabs/captain/types";
import { WaldiezCaptainAgentLibEntry } from "@waldiez/models/Agent/Captain";

export const useWaldiezAgentCaptain = (props: WaldiezAgentCaptainTabProps) => {
    const { data, onDataChange } = props;
    const [agentData, setAgentData] = useState(data);
    const [enableAgentLib, setEnableAgentLib] = useState(data.agentLib.length > 0);
    const [agentLib, setAgentLib] = useState<WaldiezCaptainAgentLibEntry[]>(data.agentLib);

    const onChange = (partialData: Partial<typeof agentData>) => {
        setAgentData({
            ...agentData,
            ...partialData,
        });
        onDataChange({
            ...partialData,
        });
    };

    const onMaxRoundChange = (value: number | null) => {
        if (typeof value === "number") {
            onChange({
                maxRound: value,
            });
        }
    };

    // const onMaxTurnsChange = (value: number | null) => {
    //     if (typeof value === "number") {
    //         onChange({
    //             maxTurns: value,
    //         });
    //     }
    // };
    const onToolLibChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        onChange({
            toolLib: checked ? "default" : null,
        });
    };
    const onEnableAgentLibChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEnableAgentLib(event.target.checked);
        if (!event.target.checked) {
            onChange({
                agentLib: [],
            });
        } else {
            onChange({
                agentLib,
            });
        }
    };
    const parseAgentLibList = (result: object) => {
        const parsedAgentLib: WaldiezCaptainAgentLibEntry[] = [];
        if (Array.isArray(result)) {
            result.forEach(entry => {
                if (typeof entry === "object") {
                    const { name, description } = entry;
                    if (typeof name === "string" && typeof description === "string") {
                        // either systemMessage or system_message
                        const systemMessage = entry.systemMessage || entry.system_message;
                        if (typeof systemMessage === "string") {
                            parsedAgentLib.push({
                                name,
                                description,
                                systemMessage,
                            });
                        }
                    }
                }
            });
        }
        return parsedAgentLib;
    };

    const onFileUpload = (files: File[]) => {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            try {
                const parsedResult = JSON.parse(result) as WaldiezCaptainAgentLibEntry[];
                const parsedAgentLib = parseAgentLibList(parsedResult);
                setAgentLib(parsedAgentLib);
                onChange({
                    agentLib: parsedAgentLib,
                });
            } catch (_) {
                //
            }
        };
        reader.readAsText(file);
    };
    return {
        agentData,
        agentLib,
        enableAgentLib,
        onEnableAgentLibChange,
        onFileUpload,
        onMaxRoundChange,
        // onMaxTurnsChange,
        onToolLibChange,
    };
};
