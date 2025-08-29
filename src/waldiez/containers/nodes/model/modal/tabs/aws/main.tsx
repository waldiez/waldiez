/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { memo, useCallback } from "react";

import { TextInput } from "@waldiez/components";
import type { WaldiezNodeModelData } from "@waldiez/models/types";

export const WaldiezNodeModelModalAWSTab: React.FC<{
    data: WaldiezNodeModelData;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
}> = memo(({ data, onDataChange }) => {
    /**
     * Handle AWS credentials changes
     */
    const onAwsAccessKeyChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ aws: { ...data.aws, accessKey: event.target.value } });
        },
        [data.aws, onDataChange],
    );
    const onAwsSecretKeyChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ aws: { ...data.aws, secretKey: event.target.value } });
        },
        [data.aws, onDataChange],
    );
    const onAwsRegionChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ aws: { ...data.aws, region: event.target.value } });
        },
        [data.aws, onDataChange],
    );
    const onAwsProfileNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ aws: { ...data.aws, profileName: event.target.value } });
        },
        [data.aws, onDataChange],
    );
    const onAwsSessionTokenChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            onDataChange({ aws: { ...data.aws, sessionToken: event.target.value } });
        },
        [data.aws, onDataChange],
    );
    return (
        <div className="flex-column">
            <TextInput
                value={data.aws?.accessKey || ""}
                name="aws-access-key"
                label="AWS Access Key:"
                placeholder="AWS Access Key"
                onChange={onAwsAccessKeyChange}
            />
            <TextInput
                value={data.aws?.secretKey || ""}
                name="aws-secret-key"
                label="AWS Secret Key:"
                placeholder="AWS Secret Key"
                onChange={onAwsSecretKeyChange}
            />
            <TextInput
                value={data.aws?.region || ""}
                name="aws-region"
                label={"AWS Region:"}
                placeholder="AWS Region"
                onChange={onAwsRegionChange}
            />
            <TextInput
                value={data.aws?.profileName || ""}
                name="aws-profile-name"
                label={"AWS Profile Name:"}
                placeholder="AWS Profile Name"
                onChange={onAwsProfileNameChange}
            />
            <TextInput
                value={data.aws?.sessionToken || ""}
                name="aws-session-token"
                label={"AWS Session Token:"}
                placeholder="AWS Session Token"
                onChange={onAwsSessionTokenChange}
            />
        </div>
    );
});
