/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { afterEach, vi } from "vitest";

import { getProps, startApp } from "..";

const flowLinksBaseUrl = "https://raw.githubusercontent.com/waldiez/examples/refs/heads/main";
const flowLink = `${flowLinksBaseUrl}/01 - Standup Comedians/Standup Comedians 1.waldiez`;

describe("index", () => {
    beforeEach(() => {
        // mock 'ReactDOM.createRoot(document.getElementById('root')!).render(...'
        vi.mock("react-dom/client", () => ({
            default: {
                createRoot: () => ({
                    render: vi.fn(),
                }),
            },
        }));
    });
    afterEach(() => {
        vi.resetAllMocks();
    });

    it("should start the app", () => {
        const rootDiv = document.createElement("div");
        rootDiv.id = "root";
        document.body.appendChild(rootDiv);
        startApp();
    });
    it("should import a flow if it is provided in the URL", async () => {
        const rootDiv = document.createElement("div");
        rootDiv.id = "root";
        document.body.appendChild(rootDiv);
        Object.defineProperty(window, "location", {
            value: {
                search: `?flow=${flowLink}`,
            },
            writable: true,
        });
        const props = await getProps();
        expect(props).toBeTruthy();
        startApp(props);
    });
});
