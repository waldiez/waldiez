/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useState } from "react";

import { Modal, TabItem, TabItems } from "@waldiez/components";
import { WaldiezBreakpointToString } from "@waldiez/components/stepByStep";
import { BreakpointsTabs } from "@waldiez/containers/flow/modals/stepRunModal/tabs/breakpoints";
import { CheckpointsTabs } from "@waldiez/containers/flow/modals/stepRunModal/tabs/checkpoints";
import type { Checkpoint, StepRunModalProps } from "@waldiez/containers/flow/modals/stepRunModal/types";
import { useWaldiez } from "@waldiez/store";
import type { WaldiezBreakpoint } from "@waldiez/types";

export const PreStepRunModal = memo((props: StepRunModalProps) => {
    const { flowId, onStart, onClose } = props;
    const getAgents = useWaldiez(s => s.getAgents);
    const agents = getAgents();
    const isGroupChat = agents.find(agent => agent.data.agentType === "group_manager");
    const [breakpoints, setBreakpoints] = useState<WaldiezBreakpoint[]>([
        { type: "all", description: "Break on all events (default)" },
    ]);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(-1);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
    const doStart = () => {
        const bps = breakpoints.map(bp => WaldiezBreakpointToString(bp)).filter(item => item.trim() !== "");
        if (!selectedCheckpoint) {
            onStart(bps);
        } else {
            if (
                selectedHistoryIndex >= 0 &&
                selectedHistoryIndex < selectedCheckpoint.history.length &&
                selectedHistoryIndex !== selectedCheckpoint.history.length - 1 // default: last index
            ) {
                onStart(bps, `${selectedCheckpoint.id}:${selectedHistoryIndex}`);
            } else {
                onStart(bps, selectedCheckpoint.id);
            }
        }
    };
    return (
        <Modal isOpen onClose={onClose} onCancel={onClose} flowId={flowId} title="Step run">
            <div className="modal-body">
                {isGroupChat ? (
                    <TabItems activeTabIndex={0}>
                        <TabItem id="step-run-breakpoints" label="Breakpoints">
                            <BreakpointsTabs
                                {...props}
                                agents={agents}
                                breakpoints={breakpoints}
                                setBreakpoints={setBreakpoints}
                            />
                        </TabItem>
                        <TabItem id="step-run-checkpoints" label="Checkpoints">
                            <CheckpointsTabs
                                {...props}
                                selectedCheckpoint={selectedCheckpoint}
                                setSelectedCheckpoint={setSelectedCheckpoint}
                                selectedHistoryIndex={selectedHistoryIndex}
                                setSelectedHistoryIndex={setSelectedHistoryIndex}
                            />
                        </TabItem>
                    </TabItems>
                ) : (
                    <BreakpointsTabs
                        {...props}
                        agents={agents}
                        breakpoints={breakpoints}
                        setBreakpoints={setBreakpoints}
                    />
                )}
            </div>
            <div className="modal-actions">
                <button type="reset" className="modal-action-cancel" onClick={onClose}>
                    Cancel
                </button>
                <div className="flex-1"></div>
                <button type="button" className="primary" onClick={doStart}>
                    Start
                </button>
            </div>
        </Modal>
    );
});

PreStepRunModal.displayName = "PreStepRunModal";
