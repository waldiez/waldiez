/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezSwarmOnConditionAvailable,
    WaldiezSwarmOnConditionTargetType,
} from "@waldiez/models/Agent/Swarm/types";

export class WaldiezSwarmOnCondition {
    target: { id: string; order: number };
    targetType: WaldiezSwarmOnConditionTargetType;
    condition: string;
    available: WaldiezSwarmOnConditionAvailable;

    constructor(props: {
        target: { id: string; order: number };
        targetType: WaldiezSwarmOnConditionTargetType;
        condition: string;
        available: WaldiezSwarmOnConditionAvailable;
    }) {
        this.target = props.target;
        this.targetType = props.targetType;
        this.condition = props.condition;
        this.available = props.available;
    }
}

export const DEFAULT_ON_CONDITION_AVAILABLE_METHOD_CONTENT = `"""Custom on condition availability check function."""
# provide the function to determine if the agent should be available
# complete the \`custom_on_condition_available\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return a boolean.
# example:
#    def custom_on_condition_available(
#    agent: Agent,
#    message: Dict[str, Any],
# ) -> bool:
#    return message.get("agent_name", "") == agent.name
#
def custom_on_condition_available(
    agent: Agent,
    message: Dict[str, Any],
) -> bool:
    """Complete the on condition availability check function"""
    ...
`;
