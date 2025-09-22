/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { flowMapper } from "@waldiez/models/mappers";
import "@waldiez/polyfills/promiseWithResolvers";
import type { WaldiezFlow, WaldiezFlowProps, WaldiezProps } from "@waldiez/types";
import { Waldiez } from "@waldiez/waldiez";

export { showSnackbar } from "@waldiez/components/snackbar";
export type * from "@waldiez/components/types";
export type * from "@waldiez/models/types";
export type * from "@waldiez/store/types";
export {
    defaultChatConfig,
    useWaldiezChat,
    useWaldiezMessaging,
    useWaldiezStepByStep,
    useWaldiezWs,
    useWaldiezWsChat,
    useWaldiezWsMessaging,
    useWaldiezWsStepByStep,
    WaldiezBreakpointUtils,
    WaldiezChatMessageProcessor,
    WaldiezStepByStepProcessor,
    WaldiezStepByStepUtils,
    WORKFLOW_CHAT_END_MARKERS,
    WORKFLOW_DONE,
    WORKFLOW_STEP_END_MARKERS,
    WORKFLOW_STEP_MARKERS,
    WORKFLOW_STEP_START_MARKERS,
    type WaldiezChatMessageProcessingResult,
    type WaldiezWsMessageHandler,
} from "@waldiez/utils";
export type * from "@waldiez/utils/chat/types";
export type * from "@waldiez/utils/stepByStep/types";

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

// noinspection JSUnusedGlobalSymbols
/**
 * Export a flow to a JSON object.
 * @param data - The flow to export
 * @param hideSecrets - Whether to hide secrets in the exported flow
 * @param skipLinks - Whether to skip links in the exported flow
 * @returns The exported JSON object
 * @see {@link Waldiez}
 * @see {@link WaldiezFlow}
 */
export const exportFlow = (data: any, hideSecrets: boolean = true, skipLinks: boolean = true) => {
    const flow = flowMapper.importFlow(data);
    return flowMapper.exportFlow(flowMapper.toReactFlow(flow), hideSecrets, skipLinks);
};

export default Waldiez;
