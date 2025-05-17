/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useState } from "react";

import { DropZone, Modal, TextInput } from "@waldiez/components";
import { showSnackbar } from "@waldiez/utils";

// Constants
const HUB_URL = "https://hub.waldiez.io";
const HUB_UPLOAD_URL = `${HUB_URL}/api/files`;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_TIMEOUT = 10000; // 10 seconds
const ADDITIONAL_FILE_TIMEOUT = 30000; // 30 seconds
const SNACKBAR_DURATION = 5000; // 5 seconds

type ExportFlowModalProps = {
    flowId: string;
    isOpen: boolean;
    onDownload: (e: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>;
    onExport: () => string | null;
    onClose: () => void;
};

/**
 * Modal component for exporting flow data with optional hub upload
 */
export const ExportFlowModal = memo<ExportFlowModalProps>((props: ExportFlowModalProps) => {
    const { flowId, isOpen, onClose, onExport, onDownload } = props;

    // State
    const [alsoUpload, setAlsoUpload] = useState(false);
    const [hubApiToken, setHubApiToken] = useState("");
    const [additionalFile, setAdditionalFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Event handlers
    const onAlsoUploadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAlsoUpload(e.target.checked);
    }, []);

    const onHubApiTokenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setHubApiToken(e.target.value);
    }, []);

    // Display an error message using snackbar
    const showError = useCallback(
        (message: string) => {
            showSnackbar({
                flowId,
                message,
                level: "error",
                details: null,
                duration: SNACKBAR_DURATION,
            });
        },
        [flowId],
    );

    // Handle uploading to hub
    const onUploadToHub = useCallback(
        // eslint-disable-next-line max-statements
        async (_e: React.MouseEvent<HTMLButtonElement>) => {
            // Prevent multiple simultaneous uploads
            if (isUploading) {
                return;
            }

            try {
                setIsUploading(true);

                // Get flow data
                const flowString = onExport();
                if (!flowString) {
                    showError("Error exporting flow.");
                    return;
                }

                // Create form data for flow file
                const fileData = new Blob([flowString], { type: "application/json" });
                const formData = new FormData();
                formData.append("file", fileData, `${flowId}.waldiez`);

                // Upload the flow file
                const response = await fetch(`${HUB_UPLOAD_URL}/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${hubApiToken}`,
                        content_type: "application/waldiez",
                    },
                    body: formData,
                    signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
                });

                if (!response.ok) {
                    throw new Error(`Error uploading to hub: ${response.statusText}`);
                }

                const data = await response.json();

                // Upload additional file if present
                if (additionalFile) {
                    const additionalFormData = new FormData();
                    additionalFormData.append("file", additionalFile, additionalFile.name);

                    const additionalResponse = await fetch(`${HUB_UPLOAD_URL}/${data.id}/example`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${hubApiToken}`,
                            content_type: "application/csv",
                        },
                        body: additionalFormData,
                        signal: AbortSignal.timeout(ADDITIONAL_FILE_TIMEOUT),
                    });

                    if (!additionalResponse.ok) {
                        throw new Error(`Error uploading additional file: ${additionalResponse.statusText}`);
                    }
                }

                // Show success message
                showSnackbar({
                    flowId,
                    message: "Flow uploaded to hub.",
                    level: "success",
                    details: null,
                    duration: SNACKBAR_DURATION,
                });
            } catch (error) {
                console.error("Upload error:", error);
                showError("Error uploading to hub.");
            } finally {
                setIsUploading(false);
            }
        },
        [flowId, onExport, hubApiToken, additionalFile, isUploading, showError],
    );

    // Handle additional file upload
    const onAdditionalFilesUpload = useCallback(
        (files: File[]) => {
            if (files.length === 0) {
                setAdditionalFile(null);
                return;
            }

            const file = files[0];

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                showError("File size exceeds 5MB.");
                return;
            }

            // Validate file extension
            const extension = file.name.split(".").pop()?.toLowerCase();
            if (extension !== "csv") {
                showError("File is not a CSV.");
                return;
            }

            setAdditionalFile(file);
        },
        [showError],
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Flow"
            dataTestId={`export-flow-modal-${flowId}`}
        >
            <div className="modal-body">
                <div className="padding-10">
                    <label className="checkbox-label">
                        <span className="checkbox-label-view">
                            <div>
                                Share this flow to{" "}
                                <a href={HUB_URL} target="_blank" rel="noopener noreferrer" className="link">
                                    Waldiez hub
                                </a>
                            </div>
                        </span>
                        <input
                            type="checkbox"
                            checked={alsoUpload}
                            onChange={onAlsoUploadChange}
                            data-testid={`import-flow-modal-share-${flowId}`}
                        />
                        <div className="checkbox"></div>
                    </label>

                    {alsoUpload && (
                        <div className="flex full-width flex-column">
                            <div className="margin-top-10 full-width">
                                <TextInput
                                    label={<div className="no-padding margin-bottom-5">Hub API Token:</div>}
                                    value={hubApiToken}
                                    // labelInfo={"Url with info on how to get a token"}
                                    onChange={onHubApiTokenChange}
                                    placeholder="Enter your hub API token"
                                    dataTestId={`hub-api-token-${flowId}`}
                                    className="full-width"
                                    isPassword
                                />
                            </div>
                            <div className="margin-top-10 margin-bottom-20 full-width">
                                <div className="margin-bottom-10 padding-10 center">
                                    Additional CSV file (results.csv) to include:
                                </div>
                                <DropZone
                                    allowedFileExtensions={[".csv"]}
                                    flowId={flowId}
                                    onUpload={onAdditionalFilesUpload}
                                    multiple={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal-actions">
                <button type="reset" className="modal-action-cancel" onClick={onClose}>
                    Cancel
                </button>
                <div className="flex flex-row">
                    {alsoUpload && (
                        <button
                            type="submit"
                            className="modal-action-submit margin-right-20"
                            onClick={onUploadToHub}
                            data-testid={`upload-to-hub-${flowId}`}
                            disabled={isUploading || !hubApiToken}
                        >
                            {isUploading ? "Uploading..." : "Upload to Hub"}
                        </button>
                    )}
                    <button type="submit" className="modal-action-submit" onClick={onDownload}>
                        Download
                    </button>
                </div>
            </div>
        </Modal>
    );
});

ExportFlowModal.displayName = "ExportFlowModal";
