/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { TemporalState } from "zundo";

import { createContext, useContext } from "react";

import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { WaldiezState, WaldiezStore } from "@waldiez/store/types";

export const WaldiezContext = createContext<WaldiezStore | null>(null);
export function useWaldiez<T>(selector: (state: WaldiezState) => T): T {
    const store = useContext(WaldiezContext);
    if (!store) {
        throw new Error("Missing WaldiezContext.Provider in the tree");
    }
    return useStoreWithEqualityFn(store, selector, shallow);
}
export const useWaldiezHistory = <T>(selector: (state: TemporalState<Partial<WaldiezState>>) => T) => {
    const store = useContext(WaldiezContext);
    if (!store) {
        throw new Error("Missing WaldiezContext.Provider in the tree");
    }
    return useStoreWithEqualityFn(store.temporal, selector, shallow);
};
