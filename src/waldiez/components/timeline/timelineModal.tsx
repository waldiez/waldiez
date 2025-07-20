/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaX } from "react-icons/fa6";

import { Modal, Timeline } from "@waldiez/components";
import { WaldiezTimelineData } from "@waldiez/components/timeline/types";

export const TimelineModal: React.FC<{
    flowId: string;
    isOpen: boolean;
    onClose: () => void;
    data: WaldiezTimelineData;
}> = ({ flowId, isOpen, onClose, data }) => {
    return (
        <Modal
            flowId={flowId}
            id="timeline-modal"
            title="Chat Timeline"
            isOpen={isOpen}
            onClose={onClose}
            className={"modal-fullscreen"}
            hasMaximizeBtn={false}
            hasCloseBtn={true}
            hasUnsavedChanges={false}
            preventCloseIfUnsavedChanges={false}
            noHeader={true}
        >
            <div className="timeline-modal fullscreen open no-backdrop">
                <div className="modal-body">
                    <Timeline data={data} />
                </div>
            </div>
            <button
                type="button"
                title="Close preview"
                className="modal-close"
                onClick={onClose}
                data-testid="modal-close"
            >
                <FaX size={12} />
            </button>
        </Modal>
    );
};
