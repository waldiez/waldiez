/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaXmark } from "react-icons/fa6";

import { Collapsible, DropZone } from "@waldiez/components";
import { useLoadFlowStep } from "@waldiez/containers/flow/modals/importFlowModal/steps/load/hooks";
import { LoadFlowStepProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";

export const LoadFlowStep = (props: LoadFlowStepProps) => {
    const { flowId, state } = props;
    const { remoteUrl, loadedFlowData, loading } = state;
    const {
        onUpload,
        onRemoteUrlChange,
        onRemoteUrlSubmit,
        onClearLoadedFlowData,
        onSearchChange,
        onSearchSubmit,
        onSelectResult,
    } = useLoadFlowStep(props);
    return (
        <>
            <Collapsible
                title="Search the hub"
                dataTestId={`import-flow-modal-collapsible-search-${flowId}`}
                expanded
            >
                <div className="margin-top-10 margin-bottom-10 full-width flex-column">
                    <div className="full-width flex">
                        <input
                            type="text"
                            className="text-input full-width margin-right-10"
                            placeholder="Search"
                            onChange={onSearchChange}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    onSearchSubmit();
                                }
                            }}
                        />
                        <button
                            type="button"
                            title="Search"
                            className="modal-action-submit"
                            onClick={onSearchSubmit}
                            data-testid={`import-flow-modal-search-submit-${flowId}`}
                            disabled={loading}
                        >
                            Search
                        </button>
                    </div>

                    <div className="margin-top-10">
                        {state.searchResults && state.searchResults.length > 0 && (
                            <ul className="search-results-list">
                                {state.searchResults.map(result => (
                                    <li
                                        key={result.id}
                                        className="search-result-item clickable"
                                        role="button"
                                        onClick={() => onSelectResult(result)}
                                    >
                                        <span className="search-result-title">{result.name}</span>
                                        <span className="search-result-tags">
                                            {result.tags.map(tag => (
                                                <span key={tag} className="search-result-tag">
                                                    {tag}
                                                </span>
                                            ))}
                                        </span>
                                        <div className="search-result-description">{result.description}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </Collapsible>
            <Collapsible title="Upload a file" dataTestId={`import-flow-modal-collapsible-local-${flowId}`}>
                <div className="padding-10 margin-left--10 margin-right--10">
                    <DropZone
                        flowId={flowId}
                        onUpload={onUpload}
                        allowedFileExtensions={[".waldiez", ".json"]}
                    />
                </div>
            </Collapsible>
            <Collapsible title="Import from URL" dataTestId={`import-flow-modal-collapsible-url-${flowId}`}>
                <div className="margin-top-10 full-width flex-column">
                    <div className="warning margin-bottom-10">
                        <span>Warning: Importing from an untrusted source can be harmful</span>
                    </div>
                    <div className="margin-top-10 full-width flex">
                        <input
                            type="text"
                            className="text-input full-width margin-right-10"
                            placeholder="Enter URL"
                            onChange={onRemoteUrlChange}
                            value={state.remoteUrl}
                            data-testid={`import-flow-modal-url-input-${flowId}`}
                        />
                        <button
                            type="button"
                            title="Load flow from URL"
                            className="modal-action-submit"
                            onClick={onRemoteUrlSubmit}
                            data-testid={`import-flow-modal-url-submit-${flowId}`}
                            disabled={!remoteUrl.startsWith("https://") || loading}
                        >
                            Load
                        </button>
                    </div>
                </div>
            </Collapsible>
            <div className="margin-top-20 center">
                {loadedFlowData ? (
                    <div className="flex-center">
                        Loaded flow: <span className="bold italic">{loadedFlowData.name}</span>
                        <FaXmark
                            className="margin-left-10 clickable"
                            data-testid="clear-loaded-flow-data"
                            onClick={onClearLoadedFlowData}
                        />
                    </div>
                ) : (
                    <div>No flow loaded</div>
                )}
            </div>
        </>
    );
};
