/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData, WaldiezNodeAgentGroupManagerData } from "@waldiez/models";

export const useGroupManagerConfig = (props: {
    data: WaldiezNodeAgentGroupManagerData;
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { data, onDataChange } = props;
    const setSpeakersData = (partialData: Partial<WaldiezNodeAgentGroupManagerData["speakers"]>) => {
        onDataChange({
            ...data,
            speakers: { ...data.speakers, ...partialData },
        });
    };
    const onMaxRetriesForSelectingChange = (value: number | null) => {
        setSpeakersData({ maxRetriesForSelecting: value });
    };
    const onAdminNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ ...data, adminName: event.target.value });
    };
    const onMaxRoundChange = (value: number | null) => {
        onDataChange({ ...data, maxRound: value });
    };
    const onEnableClearHistoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ ...data, enableClearHistory: event.target.checked });
    };
    const onSendIntroductionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ ...data, sendIntroductions: event.target.checked });
    };
    return {
        onMaxRetriesForSelectingChange,
        onAdminNameChange,
        onMaxRoundChange,
        onEnableClearHistoryChange,
        onSendIntroductionsChange,
    };
};
