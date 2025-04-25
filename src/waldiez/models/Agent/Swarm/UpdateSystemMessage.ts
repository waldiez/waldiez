/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezSwarmUpdateSystemMessageType } from "@waldiez/models/Agent/Swarm/types";

export class WaldiezSwarmUpdateSystemMessage {
    updateFunctionType: WaldiezSwarmUpdateSystemMessageType;
    updateFunction: string;

    constructor(props: { updateFunctionType: WaldiezSwarmUpdateSystemMessageType; updateFunction: string }) {
        this.updateFunctionType = props.updateFunctionType;
        this.updateFunction = props.updateFunction;
    }
}
