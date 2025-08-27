/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Panel } from "@xyflow/react";

import React from "react";
import { FaPlusCircle } from "react-icons/fa";
import { FaCirclePlay, FaFileImport, FaGithub, FaMoon, FaPython, FaSun } from "react-icons/fa6";
import { MdIosShare } from "react-icons/md";
import { SiJupyter } from "react-icons/si";
import { VscDebugAlt } from "react-icons/vsc";

import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { WaldiezNodeType } from "@waldiez/types";

type WaldiezFlowPanelsProps = {
    flowId: string;
    skipExport?: boolean;
    skipImport?: boolean;
    skipHub?: boolean;
    selectedNodeType: WaldiezNodeType;
    onAddNode: () => void;
    onRun: () => void;
    onStepRun: () => void;
    onConvertToPy: () => void;
    onConvertToIpynb: () => void;
    onOpenImportModal: () => void;
    onExport: (e: React.MouseEvent<HTMLElement, MouseEvent>) => Promise<void>;
};
// eslint-disable-next-line complexity
export const WaldiezFlowPanels: React.FC<WaldiezFlowPanelsProps> = (props: WaldiezFlowPanelsProps) => {
    const {
        flowId,
        skipExport,
        skipImport,
        selectedNodeType,
        onAddNode,
        onRun,
        onStepRun,
        onConvertToPy,
        onConvertToIpynb,
        onOpenImportModal,
        onExport,
    } = props;
    const readOnly = useWaldiez(s => s.isReadOnly);
    const runner = useWaldiez(s => s.onRun);
    const stepRunner = useWaldiez(s => s.onStepRun);
    const onConvert = useWaldiez(s => s.onConvert);
    const isReadOnly = typeof readOnly === "boolean" ? readOnly : false;
    const includeImportButton = isReadOnly ? false : typeof skipImport === "boolean" ? !skipImport : true;
    const includeExportButton = isReadOnly ? false : typeof skipExport === "boolean" ? !skipExport : true;
    const includeRunButton = !isReadOnly && typeof runner === "function";
    const includeConvertIcons = !isReadOnly && typeof onConvert === "function";
    const includeStepByStepRun = !isReadOnly && typeof stepRunner === "function";
    const { isDark, toggleTheme } = useWaldiezTheme();
    return (
        <>
            {selectedNodeType !== "agent" && readOnly === false && (
                <Panel position="top-left">
                    <button
                        type="button"
                        className="editor-nav-action add-node currentColor"
                        onClick={onAddNode}
                        title={`Add ${selectedNodeType}`}
                        data-testid={`add-${selectedNodeType}-node`}
                    >
                        <FaPlusCircle />
                        Add {selectedNodeType}
                    </button>
                </Panel>
            )}
            <Panel position="top-right">
                <div className="editor-nav-actions">
                    {(includeRunButton || includeConvertIcons || includeStepByStepRun) && (
                        <>
                            {includeStepByStepRun && (
                                <button
                                    type="button"
                                    className="editor-nav-action"
                                    onClick={onStepRun}
                                    title="Run step-by-step"
                                    data-testid={`step-by-step-${flowId}`}
                                >
                                    <VscDebugAlt />
                                </button>
                            )}
                            {includeRunButton && (
                                <button
                                    type="button"
                                    className="editor-nav-action"
                                    onClick={onRun}
                                    title="Run flow"
                                    data-testid={`run-${flowId}`}
                                >
                                    <FaCirclePlay />
                                </button>
                            )}
                            {includeConvertIcons && (
                                <button
                                    type="button"
                                    className="editor-nav-action to-python"
                                    onClick={onConvertToPy}
                                    title="Convert to Python"
                                    data-testid={`convert-${flowId}-to-py`}
                                >
                                    <FaPython />
                                </button>
                            )}
                            {includeConvertIcons && (
                                <button
                                    type="button"
                                    className="editor-nav-action to-jupyter"
                                    onClick={onConvertToIpynb}
                                    title="Convert to Jupyter Notebook"
                                    data-testid={`convert-${flowId}-to-ipynb`}
                                >
                                    <SiJupyter />
                                </button>
                            )}
                        </>
                    )}
                    {includeImportButton && (
                        <button
                            type="button"
                            className="editor-nav-action"
                            onClick={onOpenImportModal}
                            title="Import flow"
                            data-testid={`import-flow-${flowId}-button`}
                        >
                            <FaFileImport />
                        </button>
                    )}
                    {includeExportButton && (
                        <button
                            type="button"
                            className="editor-nav-action"
                            onClick={onExport}
                            title="Export flow"
                            data-testid={`export-flow-${flowId}-button`}
                        >
                            <MdIosShare size={24} />
                        </button>
                    )}
                    <button
                        type="button"
                        className="editor-nav-action"
                        title="Github repository"
                        data-testid={`open-docs-${flowId}`}
                    >
                        <a
                            href="https://github.com/waldiez/waldiez"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaGithub />
                        </a>
                    </button>
                    <button
                        type="button"
                        className="editor-nav-action"
                        onClick={toggleTheme}
                        title="Toggle theme"
                        data-testid={`toggle-theme-${flowId}`}
                    >
                        {isDark ? <FaSun /> : <FaMoon />}
                    </button>
                </div>
            </Panel>
        </>
    );
};
