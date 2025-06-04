/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";
import { FaCopy } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";

import { useWaldiezNodeAgentFooter } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentData } from "@waldiez/models";

/**
 * Component for rendering the footer section of a Waldiez Node Agent
 * Includes action buttons for delete and clone operations
 */
export const WaldiezNodeAgentFooter = memo(
    (props: { id: string; data: WaldiezNodeAgentData; isModalOpen: boolean }) => {
        const { id, data } = props;
        const { onDelete, onClone } = useWaldiezNodeAgentFooter(props);

        return (
            <div className="agent-footer" data-testid={`agent-footer-${id}`}>
                <div className="agent-actions">
                    <FaTrashCan
                        role="button"
                        onClick={onDelete}
                        title="Delete Agent"
                        className="delete-agent no-margin no-padding clickable"
                        aria-label="Delete Agent"
                    />

                    {data.agentType !== "group_manager" && (
                        <FaCopy
                            role="button"
                            onClick={onClone}
                            title="Clone Agent"
                            className="clone-agent no-margin no-padding clickable"
                            aria-label="Clone Agent"
                        />
                    )}
                </div>
            </div>
        );
    },
);

WaldiezNodeAgentFooter.displayName = "WaldiezNodeAgentFooter";
