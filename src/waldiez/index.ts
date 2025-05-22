/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { flowMapper } from "@waldiez/models/mappers";
import { WaldiezFlowProps, WaldiezProps } from "@waldiez/types";
import "@waldiez/utils/promisePolyfill";
import { Waldiez } from "@waldiez/waldiez";

export type {
    WaldiezActiveRequest,
    WaldiezChatConfig,
    WaldiezChatError,
    WaldiezChatHandlers,
    WaldiezChatMessage,
    WaldiezChatMessageType,
    WaldiezChatUserInput,
    WaldiezMediaConfig,
    WaldiezMediaContent,
    WaldiezMediaType,
    WaldiezStreamEvent,
} from "@waldiez/components/types";
export type * from "@waldiez/models/types";
export type * from "@waldiez/store/types";

export { Waldiez };
export type { WaldiezFlowProps, WaldiezProps };

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
export default Waldiez;
