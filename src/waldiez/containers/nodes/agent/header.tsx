/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";
import { FaDatabase } from "react-icons/fa";
import { FaGear, FaImage } from "react-icons/fa6";
import { TfiThought } from "react-icons/tfi";

import {
    WaldiezNodeAgentAssistantData,
    WaldiezNodeAgentData,
    WaldiezNodeAgentGroupManagerData,
} from "@waldiez/models";
import { AGENT_COLORS, AGENT_ICONS } from "@waldiez/theme";

/**
 * Component for rendering the header section of a Waldiez Node Agent
 * Displays agent type icons, settings button, and agent name
 */
export const WaldiezNodeAgentHeader = memo(
    (props: { id: string; data: WaldiezNodeAgentData; onOpenNodeModal: () => void }) => {
        const { id, data, onOpenNodeModal } = props;
        const agentType = data.agentType;
        const agentImgSrc = AGENT_ICONS[agentType];

        // Determine the display name based on agent type
        const displayName =
            agentType === "group_manager"
                ? (data as WaldiezNodeAgentGroupManagerData).groupName || `Group managed by ${data.label}`
                : data.label;

        return (
            <div className="agent-header">
                <div className="agent-header-left">
                    <FaGear
                        role="button"
                        className="clickable"
                        onClick={onOpenNodeModal}
                        aria-label="Open Settings"
                        title="Open Settings"
                    />

                    {/* Agent type-specific icons */}
                    {data.agentType === "rag_user_proxy" && (
                        <FaDatabase
                            color={AGENT_COLORS.rag_user_proxy}
                            aria-hidden="true"
                            title="RAG User Proxy"
                        />
                    )}

                    {data.agentType === "assistant" &&
                        (data as WaldiezNodeAgentAssistantData).isMultimodal === true && (
                            <FaImage
                                color={AGENT_COLORS.assistant}
                                aria-hidden="true"
                                title="Multimodal Assistant"
                            />
                        )}

                    {data.agentType === "reasoning" && (
                        <TfiThought
                            size={18}
                            strokeWidth={0.1}
                            color={AGENT_COLORS.reasoning}
                            aria-hidden="true"
                            title="Reasoning Agent"
                        />
                    )}

                    <div className="agent-label" data-testid={`agent-header-label-${id}`}>
                        {displayName}
                    </div>
                </div>
                <img src={agentImgSrc} title={data.label} alt={`${data.label} icon`} />
            </div>
        );
    },
);

WaldiezNodeAgentHeader.displayName = "WaldiezNodeAgentHeader";
