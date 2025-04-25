/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezSwarmOnConditionAvailable } from "@waldiez/models";

export type OnConditionAvailableProps = {
    data: WaldiezSwarmOnConditionAvailable;
    flowId: string;
    darkMode: boolean;
    onDataChange: (value: WaldiezSwarmOnConditionAvailable) => void;
};
