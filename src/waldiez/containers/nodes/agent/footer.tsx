/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaCopy } from "react-icons/fa";
import { FaTrashCan } from "react-icons/fa6";

import { useWaldiezNodeAgentFooter } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentData } from "@waldiez/models";
import { getDateString } from "@waldiez/utils";

export const WaldiezNodeAgentFooter = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    isModalOpen: boolean;
}) => {
    const { id, data } = props;
    const { onDelete, onClone } = useWaldiezNodeAgentFooter(props);
    return (
        <div className="agent-footer" data-testid={`agent-footer-${id}`}>
            <div className="agent-actions">
                <FaTrashCan
                    role="button"
                    onClick={onDelete}
                    title="Delete Agent"
                    className={"delete-agent no-margin no-padding clickable"}
                />
                {data.agentType !== "manager" && (
                    <>
                        <div className="date-info">{getDateString(data.updatedAt)}</div>
                        <FaCopy
                            role="button"
                            onClick={onClone}
                            title="Clone Agent"
                            className={"clone-agent no-margin no-padding clickable"}
                        />
                    </>
                )}
            </div>
        </div>
    );
};
