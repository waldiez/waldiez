/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import React, { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

import { type CSSSize, clampOpt, toPixels } from "@waldiez/components/floatingPanel/utils";

type FloatingPanelProps = {
    flowId: string;
    title?: React.ReactNode | string;
    headerLeft?: React.ReactNode | string;
    headerRight?: React.ReactNode | string;
    headerClassName?: string;
    headerStyle?: CSSProperties;
    minWidth?: CSSSize; // default 320
    maxWidth?: CSSSize; // default 720
    maxHeight?: CSSSize; // default 720
    minHeight?: CSSSize; // default 50;
    rightOffset?: number; // default 10
    bottomOffset?: number; // default 10
    initialWidth?: CSSSize; // default 35vw
    initialHeight?: CSSSize; // default: 100px;
    children?: React.ReactNode;
};

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
    flowId,
    title = "Panel",
    headerClassName = "",
    headerLeft = undefined,
    headerRight = undefined,
    headerStyle = {},
    minWidth = 420,
    maxWidth = 720,
    maxHeight = 720,
    minHeight = 50,
    rightOffset = 10,
    bottomOffset = 10,
    initialWidth = "35vw",
    initialHeight = 100,
    children,
}) => {
    const headerHeight = 40;
    const getBoundaryRect = useCallback(() => {
        const el = document.getElementById(`rf-root-${flowId}`);
        if (el) {
            return el.getBoundingClientRect();
        }
        // fallback to viewport
        return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    }, [flowId]);

    // eslint-disable-next-line max-statements
    const initialSize = useMemo(() => {
        if (typeof document === "undefined" || typeof window === "undefined") {
            const iw = 1200;
            const ih = 800;
            const w0 = toPixels(initialWidth, "w", iw, ih) ?? Math.round((iw * 35) / 100);
            const h0 = toPixels(initialHeight, "h", iw, ih) ?? 300;
            return { w: w0, h: h0 };
        }
        const container = document.getElementById(`rf-root-${flowId}`) || document.body;
        const rect = container.getBoundingClientRect();
        const iw = rect?.width ?? 1200;
        const ih = rect?.height ?? 800;

        // Interpret props relative to viewport
        const parsedMinW = toPixels(minWidth, "w", iw, ih);
        const parsedMaxW = toPixels(maxWidth, "w", iw, ih);
        const parsedMinH = toPixels(minHeight, "h", iw, ih);
        const parsedMaxH = toPixels(maxHeight, "h", iw, ih);

        // Reasonable defaults if both sides are missing
        const defaultMinW = 320;
        const defaultMaxW = 720;
        const defaultMinH = 100;
        const defaultMaxH = 720;

        const minW = parsedMinW ?? defaultMinW;
        const maxW = parsedMaxW ?? defaultMaxW;
        const minH = parsedMinH ?? defaultMinH;
        const maxH = parsedMaxH ?? defaultMaxH;

        const w0 = toPixels(initialWidth, "w", iw, ih) ?? Math.round((iw * 35) / 100);
        const h0 = toPixels(initialHeight, "h", iw, ih) ?? 300;

        const w = clampOpt(w0, Math.min(minW, maxW), Math.max(minW, maxW));
        const h = clampOpt(h0, Math.min(minH, maxH), Math.max(minH, maxH));
        return { w, h };
    }, [flowId, minWidth, maxWidth, minHeight, maxHeight, initialWidth, initialHeight]);

    // Position and size (used only when expanded)
    const [left, setLeft] = useState<number>(0);
    const [top, setTop] = useState<number>(0);
    const [width, setWidth] = useState<number>(initialSize.w);
    const [height, setHeight] = useState<number>(initialSize.h);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Remember last expanded size/position to restore on expand
    const lastExpanded = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(
        null,
    );

    // Clamp helpers
    const clampSize = useCallback(
        // eslint-disable-next-line max-statements
        (w: number, h: number) => {
            const rect = getBoundaryRect();
            const iw = rect.width;
            const ih = rect.height;

            const parsedMinW = toPixels(minWidth, "w", iw, ih);
            const parsedMaxW = toPixels(maxWidth, "w", iw, ih);
            const parsedMinH = toPixels(minHeight, "h", iw, ih);
            const parsedMaxH = toPixels(maxHeight, "h", iw, ih);

            const viewportMaxW = iw - rightOffset - 10;
            const viewportMaxH = ih - bottomOffset - 10;

            const intrinsicMinW = 120;
            const intrinsicMinH = headerHeight + 40;

            const effMinW = Math.max(parsedMinW ?? 0, intrinsicMinW);
            const effMaxW = Math.min(parsedMaxW ?? Number.POSITIVE_INFINITY, viewportMaxW);

            const effMinH = Math.max(parsedMinH ?? 0, intrinsicMinH);
            const effMaxH = Math.min(parsedMaxH ?? Number.POSITIVE_INFINITY, viewportMaxH);

            return {
                w: clampOpt(w, effMinW, effMaxW),
                h: clampOpt(h, effMinH, effMaxH),
            };
        },
        [getBoundaryRect, minWidth, maxWidth, minHeight, maxHeight, rightOffset, bottomOffset],
    );

    const clampPos = useCallback(
        (l: number, t: number, w = width, h = height) => {
            const rect = getBoundaryRect();
            const iw = rect.width;
            const ih = rect.height;

            const minLeft = 10;
            const minTop = 10;
            const maxLeft = Math.max(minLeft, iw - w - 10);
            const maxTop = Math.max(minTop, ih - h - 10);

            return {
                l: Math.min(Math.max(l, minLeft), maxLeft),
                t: Math.min(Math.max(t, minTop), maxTop),
            };
        },
        [width, height, getBoundaryRect],
    );

    // Initialize at bottom-right (expanded layout uses left/top)
    useEffect(() => {
        const rect = getBoundaryRect();
        const iw = rect.width;
        const ih = rect.height;
        const clamped = clampSize(initialSize.w, initialSize.h);
        const l = iw - clamped.w - rightOffset;
        const t = ih - clamped.h - bottomOffset;
        const { l: cl, t: ct } = clampPos(l, t, clamped.w, clamped.h);
        setWidth(clamped.w);
        setHeight(clamped.h);
        setLeft(cl);
        setTop(ct);
    }, [initialSize.w, initialSize.h, rightOffset, bottomOffset, clampSize, clampPos, getBoundaryRect]);

    // Window resize: keep panel in view
    useEffect(() => {
        const onResize = () => {
            // If collapsed: nothing to track, it anchors to bottom-right via CSS
            if (isCollapsed) {
                return;
            }
            const clampedSize = clampSize(width, height);
            const clampedPos = clampPos(left, top, clampedSize.w, clampedSize.h);
            setWidth(clampedSize.w);
            setHeight(clampedSize.h);
            setLeft(clampedPos.l);
            setTop(clampedPos.t);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCollapsed, left, top, width, height]);

    // Drag handlers (header only)
    const onHeaderPointerDown: React.PointerEventHandler<HTMLDivElement> = e => {
        if (isCollapsed) {
            return;
        }
        (e.target as Element).setPointerCapture?.(e.pointerId);
        dragState.current = { startX: e.clientX, startY: e.clientY, startLeft: left, startTop: top };
        window.addEventListener("pointermove", onHeaderPointerMove);
        window.addEventListener("pointerup", onHeaderPointerUp, { once: true });
    };

    const onHeaderPointerMove = (e: PointerEvent) => {
        if (!dragState.current) {
            return;
        }
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        const { l, t } = clampPos(dragState.current.startLeft + dx, dragState.current.startTop + dy);
        setLeft(l);
        setTop(t);
    };

    const onHeaderPointerUp = () => {
        dragState.current = null;
        window.removeEventListener("pointermove", onHeaderPointerMove);
    };

    // Collapse / Expand
    const toggleCollapsed = () => {
        if (!isCollapsed) {
            // Going to collapsed: remember expanded geometry
            lastExpanded.current = { left, top, width, height };
            setIsCollapsed(true);
        } else {
            // Going to expanded: restore geometry (clamped)
            const fallback = lastExpanded.current ?? { left, top, width, height };
            const size = clampSize(fallback.width, fallback.height);
            const pos = clampPos(fallback.left, fallback.top, size.w, size.h);
            setWidth(size.w);
            setHeight(size.h);
            setLeft(pos.l);
            setTop(pos.t);
            setIsCollapsed(false);
        }
    };

    const expandedStyle: React.CSSProperties = {
        position: "absolute",
        left,
        top,
        width,
        height,
        maxWidth,
        maxHeight,
        minWidth,
        minHeight,
        zIndex: 1000000,
        resize: "both",
    };

    const collapsedStyle: React.CSSProperties = {
        position: "absolute",
        right: rightOffset,
        bottom: bottomOffset,
        zIndex: 1000000,
        minWidth: 260,
    };

    return (
        <div
            ref={rootRef}
            className={`floating-panel ${isCollapsed ? "is-collapsed" : "is-expanded"}`}
            style={isCollapsed ? collapsedStyle : expandedStyle}
            aria-expanded={!isCollapsed}
        >
            <div
                className={`fp-header ${headerClassName}`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...headerStyle,
                }}
                onPointerDown={onHeaderPointerDown}
                role="toolbar"
                aria-label="Panel header"
            >
                {headerLeft && (
                    <div
                        className="fp-left"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        {headerLeft}
                    </div>
                )}
                <div className="fp-title" title={typeof title === "string" ? title : undefined}>
                    {title}
                </div>
                <div className="fp-right" style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <button
                        title={isCollapsed ? "Expand" : "Collapse"}
                        type="button"
                        onClick={toggleCollapsed}
                        className="fp-toggle"
                        aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
                    >
                        {isCollapsed ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {headerRight}
                </div>
            </div>

            {/* Content only renders when expanded */}
            {!isCollapsed && (
                <div className="fp-content">{children ?? <div className="padding-10">...</div>}</div>
            )}
        </div>
    );
};
