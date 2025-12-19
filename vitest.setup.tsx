/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { Blob, FormData } from "formdata-node";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";

export const mockMatchMedia = (matches: boolean = false) => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
};
// noinspection JSUnusedGlobalSymbols
export class ResizeObserver {
    callback: globalThis.ResizeObserverCallback;

    constructor(callback: globalThis.ResizeObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element) {
        const contentRect = {
            width: 10,
            height: 10,
            top: 10,
            left: 10,
        };
        if (typeof target.getBoundingClientRect === "function") {
            const boundingRect = target.getBoundingClientRect();
            contentRect.width = boundingRect.width;
            contentRect.height = boundingRect.height;
            contentRect.top = boundingRect.top;
            contentRect.left = boundingRect.left;
        }
        this.callback([{ target, contentRect } as globalThis.ResizeObserverEntry], this);
    }

    unobserve() {}

    disconnect() {}
}

export class DOMMatrixReadOnly {
    m22: number;
    constructor(transform: string) {
        const scale = transform?.match(/scale\(([1-9.])\)/)?.[1];
        this.m22 = scale !== undefined ? +scale : 1;
    }
}
// Only run the shim once when requested
let init = false;

export const mockReactFlow = () => {
    if (init) {
        return;
    }
    init = true;

    global.ResizeObserver = ResizeObserver;

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    global.DOMMatrixReadOnly = DOMMatrixReadOnly;

    Object.defineProperties(global.HTMLElement.prototype, {
        offsetHeight: {
            get() {
                return parseFloat(this.style.height) || 1;
            },
        },
        offsetWidth: {
            get() {
                return parseFloat(this.style.width) || 1;
            },
        },
    });

    (global.SVGElement as any).prototype.getBBox = () => ({
        x: 10,
        y: 10,
        width: 30,
        height: 30,
    });
};
vi.setConfig({ testTimeout: 30_000 });
vi.mock("zustand"); // __mocks__/zustand.ts
vi.mock("@monaco-editor/react", () => {
    const Textarea = (props: any) => (
        // @ts-ignore
        <textarea
            placeholder="mocked-monaco-editor"
            data-testid={props["data-testid"] ?? "mocked-monaco-editor"}
            value={props.value}
            onChange={e => props.onChange?.(e.target.value)}
            className={props.className ?? ""}
        />
    );

    return {
        __esModule: true,
        default: Textarea,
        Editor: Textarea,
        loader: {
            init: vi.fn(),
            config: vi.fn(),
            defineTheme: vi.fn(),
            defineMonarchLanguage: vi.fn(),
            defineThemeLoaders: vi.fn(),
            defineWorker: vi.fn(),
            getOrCreateMode: vi.fn(),
            getOrCreateModeByLanguage: vi.fn(),
            getOrCreateWorker: vi.fn(),
            getWorker: vi.fn(),
            getWorkerUrl: vi.fn(),
            setModelMarkers: vi.fn(),
            setModelMarkersWorker: vi.fn(),
            setModelMarkersWorkerUrl: vi.fn(),
            setModelMarkersUrl: vi.fn(),
        },
    };
});
vi.mock("@monaco-editor/loader", () => ({
    __esModule: true,
    default: {
        init: vi.fn(),
        config: vi.fn(),
    },
}));

globalThis.Blob = Blob;
globalThis.FormData = FormData;
if (!document.queryCommandSupported) {
    document.queryCommandSupported = () => true;
}

beforeEach(() => {
    mockReactFlow();
    mockMatchMedia();
    vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
beforeAll(async () => {
    global.ResizeObserver = ResizeObserver;
    HTMLDivElement.prototype.scrollIntoView = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
    HTMLElement.prototype.getBoundingClientRect = () =>
        ({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            top: 0,
            right: 100,
            bottom: 100,
            left: 0,
        }) as DOMRect;
    window.URL.createObjectURL = vi.fn();
    window.URL.revokeObjectURL = vi.fn();
    document.elementFromPoint = (): null => null;
});
afterAll(() => {
    vi.resetAllMocks();
});
