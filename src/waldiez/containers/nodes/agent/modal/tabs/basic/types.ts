/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData } from "@waldiez/models";

export type WaldiezAgentBasicProps = {
    id: string;
    data: WaldiezNodeAgentData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
    onAgentTypeChange: (agentType: "user_proxy" | "rag_user_proxy") => void;
};
