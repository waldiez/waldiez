/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaEdit, FaTools } from "react-icons/fa";
import { FaBars, FaRobot } from "react-icons/fa6";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import { LuBrain } from "react-icons/lu";

import { useSidebar, useSidebarView } from "@waldiez/containers/sidebar/hooks";
import { EditFlowModal } from "@waldiez/containers/sidebar/modals";
import { type SidebarViewProps } from "@waldiez/containers/sidebar/types";
import { AGENT_ICONS } from "@waldiez/theme";

export const SideBar = (props: SidebarViewProps) => {
    const { isReadonly } = props;
    const {
        flowId,
        isEditModalOpen,
        isAgentsViewCollapsed,
        onOpenEditModal,
        onCloseEditModal,
        onShowAgents,
        onShowModels,
        onShowTools,
        onUserDragStart,
        onAssistantDragStart,
        onDocDragStart,
        onReasoningDragStart,
        onCaptainDragStart,
        onManagerDragStart,
    } = useSidebarView(props);
    const { isCollapsed, toggleSidebar } = useSidebar();
    return (
        <div
            className={`sidebar${isReadonly ? " hidden" : ""}`}
            data-testid={`sidebar-${flowId}`}
            style={{ width: isCollapsed ? "40px" : "200px" }}
        >
            <div
                className="sidebar-header"
                style={{
                    justifyContent: isCollapsed ? "center" : "space-between",
                }}
            >
                {!isCollapsed && <div className="title">Waldiez</div>}
                <div
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    role="button"
                    aria-hidden="true"
                    data-testid="sidebar-toggle"
                >
                    <FaBars
                        className="sidebar-toggle-button tooltip-container clickable"
                        title={isCollapsed ? "Open sidebar" : "Close sidebar"}
                        aria-hidden="true"
                    />
                </div>
            </div>
            <div className="sidebar-content">
                <ul>
                    <li
                        className="clickable"
                        id={`edit-flow-${flowId}-sidebar-button`}
                        data-testid={`edit-flow-${flowId}-sidebar-button`}
                        onClick={onOpenEditModal}
                        title="Edit flow"
                    >
                        {isCollapsed ? (
                            <FaEdit />
                        ) : (
                            <div className="flex-align-center">
                                <FaEdit />
                                <div>Edit flow</div>
                            </div>
                        )}
                    </li>
                    <li
                        className="clickable"
                        data-node-type="model"
                        data-testid="show-models"
                        onClick={onShowModels}
                    >
                        {isCollapsed ? (
                            <LuBrain />
                        ) : (
                            <div className="flex-align-center">
                                <LuBrain />
                                <div>Models</div>
                            </div>
                        )}
                    </li>
                    <li
                        className="clickable"
                        data-node-type="tool"
                        data-testid="show-tools"
                        onClick={onShowTools}
                    >
                        {isCollapsed ? (
                            <FaTools />
                        ) : (
                            <div className="flex-align-center">
                                <FaTools />
                                <div>Tools</div>
                            </div>
                        )}
                    </li>
                    <li
                        className="clickable expandable"
                        data-node-type="agent"
                        data-testid="show-agents"
                        onClick={onShowAgents}
                    >
                        <div className="flex-align-center">
                            <FaRobot />
                            {!isCollapsed && <span>Agents</span>}
                        </div>
                        {!isCollapsed && (
                            <div className="expand-icon">
                                {isAgentsViewCollapsed ? <GoChevronDown /> : <GoChevronUp />}
                            </div>
                        )}
                    </li>
                </ul>
                {!isCollapsed && !isAgentsViewCollapsed && (
                    <>
                        <div className="dnd-description">
                            <p>Drag n' drop an agent to the canvas to add it to the flow</p>
                        </div>
                        <div
                            className="dnd-area"
                            data-testid="user-dnd"
                            onDragStart={onUserDragStart}
                            draggable
                        >
                            <img
                                src={AGENT_ICONS.user_proxy}
                                alt="User proxy icon"
                                title="User Proxy Agent"
                            />
                            User
                        </div>
                        <div
                            className="dnd-area"
                            data-testid="assistant-dnd"
                            onDragStart={onAssistantDragStart}
                            draggable
                        >
                            <img
                                alt="Assistant agent icon"
                                src={AGENT_ICONS.assistant}
                                title="Assistant Agent"
                            />
                            Assistant
                        </div>
                        <div
                            className="dnd-area"
                            data-testid="doc-dnd"
                            onDragStart={onDocDragStart}
                            draggable
                        >
                            <img alt="Doc agent icon" src={AGENT_ICONS.doc_agent} title="Document Agent" />
                            Docs Agent
                        </div>
                        <div
                            className="dnd-area"
                            data-testid="reasoning-dnd"
                            onDragStart={onReasoningDragStart}
                            draggable
                        >
                            <img
                                alt="Reasoning agent icon"
                                src={AGENT_ICONS.reasoning}
                                title="Reasoning Agent"
                            />
                            Reasoning
                        </div>
                        <div
                            className="dnd-area"
                            data-testid="captain-dnd"
                            onDragStart={onCaptainDragStart}
                            draggable
                        >
                            <img alt="Captain agent icon" src={AGENT_ICONS.captain} title="Captain Agent" />
                            Captain
                        </div>
                        <div
                            className="dnd-area"
                            data-testid="group-manager-dnd"
                            onDragStart={onManagerDragStart}
                            draggable
                        >
                            <img
                                alt="Group manager icon"
                                src={AGENT_ICONS.group_manager}
                                title="Group Manager Agent"
                            />
                            Group Manager
                        </div>
                    </>
                )}
            </div>
            <div className="spacer"></div>
            {isEditModalOpen && (
                <EditFlowModal flowId={flowId} isOpen={isEditModalOpen} onClose={onCloseEditModal} />
            )}
        </div>
    );
};
