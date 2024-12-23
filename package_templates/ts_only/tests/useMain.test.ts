import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMain } from "@my/package/components/Main/useMain";

describe("useMain Hook", () => {
    it("toggles theme correctly", () => {
        const { result } = renderHook(() => useMain());

        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe("dark");

        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.theme).toBe("light");
    });
});
