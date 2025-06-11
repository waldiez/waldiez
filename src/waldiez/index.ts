/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { flowMapper } from "@waldiez/models/mappers";
import "@waldiez/polyfills/promiseWithResolvers";
import { WaldiezFlow, WaldiezFlowProps, WaldiezProps } from "@waldiez/types";
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

export { showSnackbar } from "@waldiez/components/snackbar";
export { WaldiezChatMessageProcessor } from "@waldiez/utils";

export { Waldiez };
export type { WaldiezFlow, WaldiezFlowProps, WaldiezProps };

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

/**
 * Export a flow to a JSON object.
 * @param data - The flow to export
 * @returns The exported JSON object
 * @see {@link Waldiez}
 * @see {@link WaldiezFlow}
 */
export const exportFlow = (data: any, hideSecrets: boolean = true, skipLinks: boolean = true) => {
    const flow = flowMapper.importFlow(data);
    return flowMapper.exportFlow(flowMapper.toReactFlow(flow), hideSecrets, skipLinks);
};

export default Waldiez;
