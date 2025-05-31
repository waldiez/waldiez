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

/**
 * A custom hook to access the Waldiez store.
 * This hook uses the context to retrieve the store and allows for state selection.
 * @param selector - A function to select a part of the state from the Waldiez store.
 * @returns The selected state from the Waldiez store.
 */
export function useWaldiez<T>(selector: (state: WaldiezState) => T): T {
    const store = useContext(WaldiezContext);
    if (!store) {
        throw new Error("Missing WaldiezContext.Provider in the tree");
    }
    return useStoreWithEqualityFn(store, selector, shallow);
}
/**
 * A custom hook to access the Waldiez history store.
 * This hook uses the context to retrieve the temporal state and allows for state selection.
 * @param selector - A function to select a part of the temporal state from the Waldiez store.
 * @returns The selected temporal state from the Waldiez store.
 */
export const useWaldiezHistory = <T>(selector: (state: TemporalState<Partial<WaldiezState>>) => T) => {
    const store = useContext(WaldiezContext);
    if (!store) {
        throw new Error("Missing WaldiezContext.Provider in the tree");
    }
    return useStoreWithEqualityFn(store.temporal, selector, shallow);
};
