/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
/* eslint-disable max-lines-per-function */
import { Panel } from "@xyflow/react";

import { type FC, type MouseEvent as ReactMouseEvent, useCallback, useMemo, useRef, useState } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { FaCirclePlay, FaFileImport, FaGithub, FaMoon, FaPython, FaSun } from "react-icons/fa6";
import { FiMoreVertical } from "react-icons/fi";
import { MdIosShare } from "react-icons/md";
import { SiJupyter } from "react-icons/si";
import { TbTestPipe2 } from "react-icons/tb";
import { VscDebugAlt } from "react-icons/vsc";

import {
    type ActionDef,
    type MenuItem,
    pickVisibleGroup,
    removeActionsByKey,
    toMenuItems,
} from "@waldiez/containers/flow/panels/utils";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { type WaldiezNodeType } from "@waldiez/types";

type WaldiezFlowPanelsProps = {
    flowId: string;
    skipExport?: boolean;
    skipImport?: boolean;
    skipHub?: boolean;
    selectedNodeType: WaldiezNodeType;
    onAddNode: () => void;
    onRun: (path?: string | null) => void;
    onStepRun: (path?: string | null, breakpoints?: string[], checkpoint?: string | null) => void;
    onConvertToPy: (path?: string | null) => void;
    onConvertToIpynb: (path?: string | null) => void;
    onOpenImportModal: () => void;
    onExport: (e: ReactMouseEvent<HTMLElement, MouseEvent>) => Promise<void>;
    onBenchmark?: (path?: string | null) => void;
};

export const WaldiezFlowPanels: FC<WaldiezFlowPanelsProps> = props => {
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
        onBenchmark,
    } = props;

    const readOnly = useWaldiez(s => s.isReadOnly);
    const runner = useWaldiez(s => s.onRun);
    const stepRunner = useWaldiez(s => s.onStepRun);
    const onConvert = useWaldiez(s => s.onConvert);

    const isReadOnly = typeof readOnly === "boolean" ? readOnly : false;

    const includeImport = !isReadOnly && (typeof skipImport === "boolean" ? !skipImport : true);
    const includeExport = !isReadOnly && (typeof skipExport === "boolean" ? !skipExport : true);

    const includeRun = !isReadOnly && typeof runner === "function";
    const includeStep = !isReadOnly && typeof stepRunner === "function";
    const includeConvert = !isReadOnly && typeof onConvert === "function";
    const includeBenchmark = !isReadOnly && typeof onBenchmark === "function";

    const { isDark, toggleTheme } = useWaldiezTheme();

    const doRun = useCallback(() => onRun(), [onRun]);
    const doStepRun = useCallback(() => onStepRun(), [onStepRun]);
    const doConvertToPy = useCallback(() => onConvertToPy(), [onConvertToPy]);
    const doConvertToIpynb = useCallback(() => onConvertToIpynb(), [onConvertToIpynb]);
    const doBenchmark = useCallback(() => onBenchmark?.(), [onBenchmark]);

    const [menuOpen, setMenuOpen] = useState(false);

    // Export signature needs the event: render export as a hidden button and "click" it from menu.
    const exportBtnRef = useRef<HTMLButtonElement | null>(null);

    const groups = useMemo(() => {
        const runGroup: ActionDef[] = [];
        if (includeStep) {
            runGroup.push({
                kind: "action",
                key: "step",
                label: "Run step-by-step",
                title: "Run step-by-step",
                icon: <VscDebugAlt />,
                onClick: doStepRun,
                testId: `step-by-step-${flowId}`,
            });
        }
        if (includeRun) {
            runGroup.push({
                kind: "action",
                key: "run",
                label: "Run flow",
                title: "Run flow",
                icon: <FaCirclePlay />,
                onClick: doRun,
                testId: `run-${flowId}`,
                className: "editor-nav-action--primary",
            });
        }
        if (includeBenchmark) {
            runGroup.push({
                kind: "action",
                key: "benchmark",
                label: "Benchmark flow",
                title: "Benchmark flow",
                icon: <TbTestPipe2 />,
                onClick: doBenchmark,
                testId: `benchmark-${flowId}`,
                className: "editor-nav-action--primary",
            });
        }

        const convertGroup: ActionDef[] = [];
        if (includeConvert) {
            convertGroup.push({
                kind: "action",
                key: "to-py",
                label: "Convert to Python",
                title: "Convert to Python",
                icon: <FaPython />,
                onClick: doConvertToPy,
                testId: `convert-${flowId}-to-py`,
            });
            convertGroup.push({
                kind: "action",
                key: "to-ipynb",
                label: "Convert to Notebook",
                title: "Convert to Jupyter Notebook",
                icon: <SiJupyter />,
                onClick: doConvertToIpynb,
                testId: `convert-${flowId}-to-ipynb`,
            });
        }

        const ioGroup: ActionDef[] = [];
        if (includeImport) {
            ioGroup.push({
                kind: "action",
                key: "import",
                label: "Import flow",
                title: "Import flow",
                icon: <FaFileImport />,
                onClick: onOpenImportModal,
                testId: `import-flow-${flowId}-button`,
            });
        }
        if (includeExport) {
            ioGroup.push({
                kind: "action",
                key: "export",
                label: "Export flow",
                title: "Export flow",
                icon: <MdIosShare size={24} />,
                onClick: () => exportBtnRef.current?.click(),
                testId: `export-flow-${flowId}-button`,
            });
        }

        const utilityGroup: ActionDef[] = [
            {
                kind: "action",
                key: "theme",
                label: isDark ? "Switch to light mode" : "Switch to dark mode",
                title: "Toggle theme",
                icon: isDark ? <FaSun /> : <FaMoon />,
                onClick: toggleTheme,
                testId: `toggle-theme-${flowId}`,
            },
            {
                kind: "link",
                key: "github",
                label: "GitHub repository",
                title: "GitHub repository",
                icon: <FaGithub />,
                href: "https://github.com/waldiez/waldiez",
                testId: `open-docs-${flowId}`,
            },
        ];

        return { runGroup, convertGroup, ioGroup, utilityGroup };
    }, [
        includeStep,
        includeRun,
        includeBenchmark,
        includeConvert,
        includeImport,
        includeExport,
        isDark,
        toggleTheme,
        flowId,
        doStepRun,
        doRun,
        doBenchmark,
        doConvertToPy,
        doConvertToIpynb,
        onOpenImportModal,
    ]);

    const { visibleActions, menuItems, hasOverflow } = useMemo(() => {
        const orderedGroups = [groups.runGroup, groups.convertGroup, groups.ioGroup, groups.utilityGroup];
        const visible = pickVisibleGroup(orderedGroups);

        const visibleKeys = new Set(visible.map(a => a.key));

        // Everything not visible goes into the menu
        const all = [...groups.runGroup, ...groups.convertGroup, ...groups.ioGroup, ...groups.utilityGroup];
        removeActionsByKey(all, visibleKeys);

        // Build menu with separators by group (only if those hidden items exist)
        const items: MenuItem[] = [];

        const addGroupToMenu = (labelKey: string, g: ActionDef[]) => {
            const groupHidden = g.filter(a => !visibleKeys.has(a.key));
            if (groupHidden.length === 0) {
                return;
            }
            if (items.length > 0) {
                items.push({ kind: "separator", key: `sep-${labelKey}` });
            }
            items.push(...toMenuItems(groupHidden));
        };

        addGroupToMenu("run", groups.runGroup);
        addGroupToMenu("convert", groups.convertGroup);
        addGroupToMenu("io", groups.ioGroup);
        addGroupToMenu("utility", groups.utilityGroup);

        return {
            visibleActions: visible,
            menuItems: items,
            hasOverflow: items.length > 0,
        };
    }, [groups]);

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
                <div className="editor-nav-actions editor-nav-actions--compact">
                    {/* Hidden real export button to preserve onExport(e) */}
                    {includeExport && (
                        <button
                            ref={exportBtnRef}
                            type="button"
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden="true"
                            onClick={onExport}
                        />
                    )}

                    {visibleActions.map(a => {
                        const className = ["editor-nav-action", a.className].filter(Boolean).join(" ");
                        if (a.kind === "link") {
                            return (
                                <a
                                    key={a.key}
                                    className={`${className}`}
                                    href={a.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={a.title ?? a.label}
                                    data-testid={a.testId}
                                >
                                    {a.icon}
                                </a>
                            );
                        }
                        return (
                            <button
                                key={a.key}
                                type="button"
                                className={className}
                                onClick={a.onClick}
                                title={a.title ?? a.label}
                                disabled={a.disabled}
                                data-testid={a.testId}
                            >
                                {a.icon}
                            </button>
                        );
                    })}

                    {/* Overflow only when needed */}
                    {hasOverflow && (
                        <div className="editor-nav-menu">
                            <button
                                type="button"
                                className="editor-nav-action"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen(v => !v)}
                                title="More"
                                data-testid={`more-${flowId}`}
                            >
                                <FiMoreVertical />
                            </button>

                            {menuOpen && (
                                <div className="editor-nav-menu__popover" role="menu">
                                    {menuItems.map(item => {
                                        if (item.kind === "separator") {
                                            return <div key={item.key} className="editor-nav-menu__sep" />;
                                        }
                                        if (item.kind === "link") {
                                            return (
                                                <a
                                                    key={item.key}
                                                    className="editor-nav-menu__item"
                                                    role="menuitem"
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setMenuOpen(false)}
                                                >
                                                    <span className="editor-nav-menu__icon">{item.icon}</span>
                                                    <span className="editor-nav-menu__label">
                                                        {item.label}
                                                    </span>
                                                </a>
                                            );
                                        }
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                className="editor-nav-menu__item"
                                                role="menuitem"
                                                onClick={() => {
                                                    setMenuOpen(false);
                                                    item.onClick();
                                                }}
                                                disabled={item.disabled}
                                            >
                                                <span className="editor-nav-menu__icon">{item.icon}</span>
                                                <span className="editor-nav-menu__label">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Panel>
        </>
    );
};
