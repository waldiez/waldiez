/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { flowMapper } from "@waldiez/models/mappers";
import { WaldiezFlowProps, WaldiezPreviousMessage, WaldiezProps, WaldiezUserInput } from "@waldiez/types";
import "@waldiez/utils/promisePolyfill";
import { Waldiez } from "@waldiez/waldiez";

export type { WaldiezFlowProps, WaldiezPreviousMessage, WaldiezProps, WaldiezUserInput };

/**
 * Import a flow from a JSON object.
 * @param data - The JSON object to import
 * @returns The imported flow
 * @see {@link Waldiez}
 * @see {@link WaldiezFlowProps}
 */
export const importFlow = (data: any) => {
    const flow = flowMapper.importFlow(data);
    return flowMapper.toReactFlow(flow);
};
export { Waldiez };
export default Waldiez;
