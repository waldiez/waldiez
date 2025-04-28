/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { flowMapper } from "@waldiez/models/mappers";
import { WaldiezPreviousMessage, WaldiezProps, WaldiezUserInputType } from "@waldiez/types";
import "@waldiez/utils/promisePolyfill";
import { Waldiez } from "@waldiez/waldiez";

export type { WaldiezPreviousMessage, WaldiezProps, WaldiezUserInputType };

export const importFlow = (data: any) => {
    const flow = flowMapper.importFlow(data);
    return flowMapper.toReactFlow(flow);
};
export { Waldiez };
export default Waldiez;
