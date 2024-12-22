import { startApp } from "../src";
import { afterEach, vi } from "vitest";

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
});
