/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

/**
 * Workflow markers that indicate the workflow has started or finished
 * These match the MESSAGES constant in the Python runner
 */
export const WORKFLOW_STEP_START_MARKERS = ["<Waldiez step-by-step> - Starting workflow..."] as const;
// cspell: disable-next-line
export const DEBUG_INPUT_PROMPT = "[Step] (c)ontinue, (r)un, (q)uit, (i)nfo, (h)elp, (st)ats:";
export const WORKFLOW_STEP_END_MARKERS = [
    "<Waldiez step-by-step> - Workflow finished",
    "<Waldiez step-by-step> - Workflow stopped by user",
    "<Waldiez step-by-step> - Workflow execution failed:",
] as const;

export const WORKFLOW_STEP_MARKERS = [...WORKFLOW_STEP_START_MARKERS, ...WORKFLOW_STEP_END_MARKERS] as const;
