/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaXmark } from "react-icons/fa6";

import { Collapsible, DropZone } from "@waldiez/components";
import { useLoadFlowStep } from "@waldiez/containers/flow/modals/importFlowModal/steps/load/hooks";
import { LoadFlowStepProps } from "@waldiez/containers/flow/modals/importFlowModal/steps/types";

const includeSearch = false;

export const LoadFlowStep = (props: LoadFlowStepProps) => {
    const { flowId, state } = props;
    const { remoteUrl, loadedFlowData } = state;
    const { onUpload, onRemoteUrlChange, onRemoteUrlSubmit, onClearLoadedFlowData } = useLoadFlowStep(props);
    return (
        <>
            <Collapsible
                title="Upload a file"
                dataTestId={`import-flow-modal-collapsible-local-${flowId}`}
                expanded={!includeSearch}
            >
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
                            disabled={!remoteUrl.startsWith("https://")}
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

/*
Once we can `Search the hub`
  <Collapsible
    title="Search the hub"
    dataTestId={`import-flow-modal-collapsible-search-${flowId}`}
    expanded
  >
    <div className="margin-top-10 full-width flex">
      <input
        type="text"
        className="text-input full-width margin-right-10"
        placeholder="Search"
        onChange={onSearchChange}
        value={searchTerm}
        data-testid={`import-flow-modal-search-input-${flowId}`}
      />
      <button
        type="button"
        title="Search"
        className="modal-action-submit"
        onClick={onSearchSubmit}
        data-testid={`import-flow-modal-search-submit-${flowId}`}
      >
        Search
      </button>
    </div>
    {/ * Also have something here ? with the search results * /}
    </Collapsible>
  )}
*/
