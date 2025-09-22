/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type FC, memo, useCallback, useEffect, useMemo, useState } from "react";

import { getToolIcon } from "@waldiez/containers/nodes/tool/utils";
import type { WaldiezNodeAgentData, WaldiezNodeModel, WaldiezNodeTool } from "@waldiez/models/types";
import { useWaldiez } from "@waldiez/store";
import { LOGOS } from "@waldiez/theme";

type WaldiezNodeAgentBodyProps = {
    flowId: string;
    id: string;
    data: WaldiezNodeAgentData;
    isModalOpen: boolean;
    isReadOnly: boolean;
    onOpenModal: () => void;
};

/**
 * Component for rendering the body section of a Waldiez Node Agent
 * Displays model information, tools, and a description editor
 */
export const WaldiezNodeAgentBody: FC<WaldiezNodeAgentBodyProps> = memo(
    (props: WaldiezNodeAgentBodyProps) => {
        // console.log("WaldiezNodeAgentBody rendering for:", props.id);
        const { id, data } = props;
        const agentType = data.agentType;

        if (agentType === "group_manager") {
            return <div className="agent-content" />;
        }

        if (agentType === "user_proxy") {
            return (
                <div className="agent-content">
                    <div className="agent-label margin-top-20" data-testid={`agent-${id}-label`}>
                        {data.label}
                    </div>
                </div>
            );
        }

        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useAgentContentView(id, data);
    },
);

/**
 * Custom hook for displaying models and tools based on available space
 */
const useAgentContentView = (id: string, data: WaldiezNodeAgentData) => {
    const getModels = useWaldiez(s => s.getModels);
    const getTools = useWaldiez(s => s.getTools);
    const [modelsToShow, setModelsToShow] = useState(2);
    const [toolsToShow, setToolsToShow] = useState(2);
    const [containerHeight, setContainerHeight] = useState(0);

    // Get the data
    const { tools, agentModelNames, agentWaldiezModelAPITypes, agentModelLogos } = useMemo(() => {
        const models = getModels() as WaldiezNodeModel[];
        const tools = getTools() as WaldiezNodeTool[];

        const agentModelNames = data.modelIds
            .map(modelId => models.find(model => model.id === modelId)?.data.label ?? "")
            .filter(entry => entry !== "");
        const agentWaldiezModelAPITypes = data.modelIds
            .map(modelId => models.find(model => model.id === modelId)?.data.apiType ?? "")
            .filter(entry => entry !== "");
        const agentModelLogos = agentWaldiezModelAPITypes
            .map(apiType => LOGOS[apiType] ?? "")
            .filter(entry => entry !== "");

        return {
            tools,
            agentModelNames,
            agentWaldiezModelAPITypes,
            agentModelLogos,
        };
    }, [getModels, getTools, data.modelIds]);

    const calculateDisplayCounts = useCallback(
        // eslint-disable-next-line max-statements
        (availableHeight: number) => {
            const itemHeight = 18; // Must match CSS!
            const maxItems = Math.floor(availableHeight / itemHeight);
            const totalModels = agentModelNames.length;
            const totalTools = data.tools.length;

            if (maxItems <= 0) {
                return { models: 0, tools: 0 };
            }

            // Prefer to distribute space evenly (rounded up for models if odd)
            let modelsToShow = 0;
            let toolsToShow = 0;

            if (totalModels === 0) {
                // Only tools
                toolsToShow = Math.min(totalTools, maxItems);
            } else if (totalTools === 0) {
                // Only models
                modelsToShow = Math.min(totalModels, maxItems);
            } else {
                // Both models and tools: split as evenly as possible
                modelsToShow = Math.min(totalModels, Math.ceil(maxItems / 2));
                toolsToShow = Math.min(totalTools, maxItems - modelsToShow);

                // If there are leftover slots (because one group is too small), give the rest to the other group
                if (modelsToShow < Math.ceil(maxItems / 2)) {
                    const extra = Math.min(
                        totalModels - modelsToShow,
                        maxItems - (modelsToShow + toolsToShow),
                    );
                    modelsToShow += Math.max(0, extra);
                }
                if (toolsToShow < Math.floor(maxItems / 2)) {
                    const extra = Math.min(totalTools - toolsToShow, maxItems - (modelsToShow + toolsToShow));
                    toolsToShow += Math.max(0, extra);
                }
            }

            return { models: modelsToShow, tools: toolsToShow };
        },
        [agentModelNames.length, data.tools.length],
    );

    // Container ref callback for ResizeObserver
    const contentRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node) {
                // console.log("contentRef: node is null");
                return;
            }

            const updateVisibleCounts = () => {
                // Try to get the React Flow node height instead of just content
                const reactFlowNode = node.closest(".react-flow__node") as HTMLElement;
                const nodeHeight = reactFlowNode?.offsetHeight || node.offsetHeight;
                const FOOTER_HEIGHT = 20;
                const PADDING = 20; // 10px top + 10px bottom
                const LABEL_HEIGHT = 40; // Height of the agent label

                const availableHeight = nodeHeight - FOOTER_HEIGHT - PADDING - LABEL_HEIGHT; // Subtract all fixed vertical elements

                setContainerHeight(availableHeight);

                const { models, tools } = calculateDisplayCounts(availableHeight);

                // Debug the calculation
                // console.log("Height calculation result:", {
                //     availableHeight,
                //     itemHeight: 18,
                //     labelHeight: 20,
                //     usableHeight: availableHeight - 20,
                //     maxItems: Math.floor((availableHeight - 20) / 18),
                //     totalModels: agentModelNames.length,
                //     totalTools: data.tools.length,
                //     finalResult: { models, tools },
                // });

                setModelsToShow(models);
                setToolsToShow(tools);
            };

            // Initial calculation with a small delay to ensure layout is complete
            setTimeout(updateVisibleCounts, 0);
            const resizeObserver = new ResizeObserver(updateVisibleCounts);

            resizeObserver.observe(node);

            return () => {
                resizeObserver.disconnect();
            };
        },
        [calculateDisplayCounts],
    );

    // Fallback when ResizeObserver isn't available or node isn't ready
    useEffect(() => {
        if (containerHeight === 0) {
            // Default allocation when height is unknown - be more generous
            const { models, tools } = calculateDisplayCounts(120); // Assume bigger default
            setModelsToShow(models);
            setToolsToShow(tools);
        }
    }, [calculateDisplayCounts, containerHeight]);

    return useMemo(() => {
        const hasModels = agentModelNames.length > 0;
        const hasTools = data.tools.length > 0;
        const showModels = hasModels && modelsToShow > 0;
        const showTools = hasTools && toolsToShow > 0;

        // console.log("Rendering with:", {
        //     hasModels,
        //     hasTools,
        //     showModels,
        //     showTools,
        //     modelsToShow,
        //     toolsToShow,
        //     containerHeight,
        // });

        return (
            <div ref={contentRef} className="agent-content">
                <div className="agent-label" data-testid={`agent-${id}-label`}>
                    {data.label}
                </div>

                {/* Models Section */}
                {showModels && (
                    <div className="agent-models-preview">
                        {agentModelNames.slice(0, modelsToShow).map((name, index) => (
                            <div key={name} className="agent-model-preview" data-testid="agent-model-preview">
                                <div className={`agent-model-img ${agentWaldiezModelAPITypes[index]}`}>
                                    <img src={agentModelLogos[index]} title={name} alt={name} />
                                </div>
                                <div
                                    className="font-small agent-model-name"
                                    data-testid={`agent-${id}-linked-model-${index}`}
                                >
                                    {name}
                                </div>
                            </div>
                        ))}
                        {agentModelNames.length > modelsToShow && (
                            <div className="agent-more-indicator">
                                <div className="agent-model-img">
                                    <span>⋯</span>
                                </div>
                                <div className="font-small agent-model-name">
                                    +{agentModelNames.length - modelsToShow} more
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No models message */}
                {!hasModels && data.agentType !== "user_proxy" && (
                    <div className="agent-models-preview">
                        <div className="font-small agent-model-name">No models</div>
                    </div>
                )}

                {/* Tools Section */}
                {showTools && (
                    <div className="agent-tools-preview">
                        {data.tools.slice(0, toolsToShow).map((linkedTool, index) => {
                            const tool = tools.find(tool => tool.id === linkedTool.id);
                            if (!tool) {
                                return null;
                            }

                            return (
                                <div
                                    key={tool.id}
                                    className="agent-tool-preview"
                                    data-testid="agent-tool-preview"
                                >
                                    <div className="agent-tool-img">
                                        {getToolIcon(tool.data.label, tool.data.toolType)}
                                    </div>
                                    <div
                                        className="font-small agent-tool-name"
                                        data-testid={`agent-${id}-linked-tool-${index}`}
                                    >
                                        {tool.data.label}
                                    </div>
                                </div>
                            );
                        })}
                        {data.tools.length > toolsToShow && (
                            <div className="agent-more-indicator">
                                <div className="agent-tool-img">
                                    <span>⋯</span>
                                </div>
                                <div className="font-small agent-tool-name">
                                    +{data.tools.length - toolsToShow} more
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No tools message */}
                {!hasTools && !["user_proxy", "rag_user_proxy"].includes(data.agentType) && (
                    <div className="agent-tools-preview">
                        <div className="font-small agent-tool-name">No tools</div>
                    </div>
                )}
            </div>
        );
    }, [
        agentModelNames,
        data.tools,
        data.label,
        data.agentType,
        modelsToShow,
        toolsToShow,
        contentRef,
        id,
        agentWaldiezModelAPITypes,
        agentModelLogos,
        tools,
    ]);
};
