/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentSwarm, WaldiezSwarmAfterWork } from "@waldiez/types";

export type AfterWorkProps = {
    value: WaldiezSwarmAfterWork | null;
    agents: WaldiezNodeAgentSwarm[];
    darkMode: boolean;
    onChange: (value: WaldiezSwarmAfterWork | null) => void;
};
