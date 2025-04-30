/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaDatabase } from "react-icons/fa";
import { FaGear, FaImage } from "react-icons/fa6";
import { TfiThought } from "react-icons/tfi";

import { WaldiezNodeAgentAssistantData, WaldiezNodeAgentData } from "@waldiez/models";
import { AGENT_COLORS, AGENT_ICONS } from "@waldiez/theme";

export const WaldiezNodeAgentHeader = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    onOpenNodeModal: () => void;
}) => {
    const { id, data, onOpenNodeModal } = props;
    const agentType = data.agentType;
    const agentImgSrc = AGENT_ICONS[agentType];
    return (
        <div className="agent-header">
            <div className="agent-header-left">
                <FaGear role="button" className="clickable" onClick={onOpenNodeModal} />
                {data.agentType === "rag_user" && <FaDatabase color={AGENT_COLORS.rag_user} />}
                {data.agentType === "assistant" &&
                    (data as WaldiezNodeAgentAssistantData).isMultimodal === true && (
                        <FaImage color={AGENT_COLORS.assistant} />
                    )}
                {data.agentType === "reasoning" && (
                    <TfiThought size={18} strokeWidth={0.1} color={AGENT_COLORS.reasoning} />
                )}
                <div className="agent-label" data-testid={`agent-header-label-${id}`}>
                    {data.label}
                </div>
            </div>
            <img src={agentImgSrc} title={data.label} alt={data.label} />
        </div>
    );
};
