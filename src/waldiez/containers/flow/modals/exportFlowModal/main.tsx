/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { DropZone, Modal, TextInput } from "@waldiez/components";
import { ExportFlowModalProps } from "@waldiez/containers/flow/modals/exportFlowModal/types";
import { showSnackbar } from "@waldiez/utils";

const HUB_URL = "https://hub.waldiez.io";
const HUB_UPLOAD_URL = `${HUB_URL}/api/files`;

export const ExportFlowModal = (props: ExportFlowModalProps) => {
    const { flowId, isOpen, onClose, onExport, onDownload } = props;
    const [alsoUpload, setAlsoUpload] = useState(false);
    const [hubApiToken, setHubApiToken] = useState("");
    const [additionalFile, setAdditionalFile] = useState<File | null>(null);
    const onAlsoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAlsoUpload(e.target.checked);
    };
    const onHubApiTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHubApiToken(e.target.value);
    };
    const onUploadToHub = (_e: React.MouseEvent<HTMLButtonElement>) => {
        const flowString = onExport();
        if (!flowString) {
            showSnackbar(flowId, "Error exporting flow.", "error", null, 5e3);
            return;
        }
        const fileData = new Blob([flowString], { type: "application/json" });
        const formData = new FormData();
        formData.append("file", fileData, `${flowId}.waldiez`);
        fetch(`${HUB_UPLOAD_URL}/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${hubApiToken}`,
                content_type: "application/waldiez",
            },
            body: formData,
            signal: AbortSignal.timeout(1e4),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error uploading to hub");
                }
                return response.json();
            })
            .then(data => {
                if (additionalFile) {
                    const additionalFormData = new FormData();
                    additionalFormData.append("file", additionalFile, additionalFile.name);
                    return fetch(`${HUB_UPLOAD_URL}/${data.id}/example`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${hubApiToken}`,
                            content_type: "application/csv",
                        },
                        body: additionalFormData,
                        signal: AbortSignal.timeout(3e4),
                    });
                }
            })
            .then(response => {
                if (response && !response.ok) {
                    console.error("Error uploading additional file to hub:", response.statusText);
                    throw new Error("Error uploading additional file to hub");
                }
                showSnackbar(flowId, "Flow uploaded to hub.", "success", null, 5e3);
            })
            .catch(() => {
                showSnackbar(flowId, "Error uploading to hub.", "error", null, 5e3);
            });
    };
    const onAdditionalFilesUpload = (files: File[]) => {
        if (files.length > 0) {
            const file = files[0];
            if (file.size > 5 * 1024 * 1024) {
                showSnackbar(flowId, "File size exceeds 5MB.", "error", null, 5e3);
                return;
            }
            if (file.name.split(".").pop() !== "csv") {
                showSnackbar(flowId, "File is not a csv.", "error", null, 5e3);
                return;
            }
            setAdditionalFile(file);
        } else {
            setAdditionalFile(null);
        }
    };
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Flow"
            dataTestId={`export-flow-modal-${flowId}`}
        >
            <div className="modal-body padding-10">
                <div className="flex flex-column full-width">
                    <div className="margin-left-5 full-width">
                        <label className="checkbox-label full-width">
                            <span className="checkbox-label-view">
                                <div>
                                    Share this flow to{" "}
                                    <a
                                        href={HUB_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link"
                                    >
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
                    </div>
                    {/* <InfoCheckbox
                            // label="Share to Hub"
                            label={

                            }
                            info={"Check this box to upload the flow to waldiez hub."}
                            checked={alsoUpload}
                            onChange={onAlsoUploadChange}
                            dataTestId={`import-flow-modal-share-${flowId}`}
                        /> */}
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
                                    Additional csv files to include:
                                </div>
                                <DropZone
                                    allowedFileExtensions={[".csv"]}
                                    flowId={flowId}
                                    onUpload={onAdditionalFilesUpload}
                                    multiple={true}
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
                        >
                            Upload to Hub
                        </button>
                    )}
                    <button type="submit" className="modal-action-submit" onClick={onDownload}>
                        Download
                    </button>
                </div>
            </div>
        </Modal>
    );
};
