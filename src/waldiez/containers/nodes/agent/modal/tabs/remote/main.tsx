/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type ChangeEvent, memo, useCallback, useMemo } from "react";

import { Dict, InfoCheckbox, NumberInput, TextInput } from "@waldiez/components";
import type { WaldiezAgentRemoteTabProps } from "@waldiez/containers/nodes/agent/modal/tabs/remote/types";

export const WaldiezAgentRemoteTab = memo((props: WaldiezAgentRemoteTabProps) => {
    const { id, data, onDataChange } = props;
    const onServerEnabledChange = useCallback(
        (checked: boolean) => {
            onDataChange({
                server: {
                    ...data.server,
                    enabled: checked,
                },
            });
        },
        [data.server, onDataChange],
    );
    const onSilentChange = useCallback(
        (checked: boolean) => {
            onDataChange({
                client: {
                    ...data.client,
                    silent: checked,
                },
            });
        },
        [data.client, onDataChange],
    );
    const onUrlChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onDataChange({
                client: {
                    ...data.client,
                    url: event.target.value,
                },
            });
        },
        [data.client, onDataChange],
    );
    const onMaxReconnectsChange = useCallback(
        (value: number | null) => {
            onDataChange({
                client: {
                    ...data.client,
                    maxReconnects: value,
                },
            });
        },
        [data.client, onDataChange],
    );
    const onPollingIntervalChange = useCallback(
        (value: number | null) => {
            onDataChange({
                client: {
                    ...data.client,
                    pollingInterval: value,
                },
            });
        },
        [data.client, onDataChange],
    );
    const onAddHeader = useCallback(
        (key: string, value: string) => {
            const headers = { ...(data.client.headers || {}) };
            headers[key] = value;
            onDataChange({
                client: {
                    ...data.client,
                    headers,
                },
            });
        },
        [data.client, onDataChange],
    );
    const onUpdateHeaders = useCallback(
        (items: { [key: string]: unknown }) => {
            onDataChange({
                client: {
                    ...data.client,
                    headers: items,
                },
            });
        },
        [data.client, onDataChange],
    );
    const onDeleteHeader = useCallback(
        (key: string) => {
            const headers = { ...(data.client.headers || {}) };
            if (key in headers) {
                delete headers[key];
                onDataChange({
                    client: {
                        ...data.client,
                        headers,
                    },
                });
            }
        },
        [data.client, onDataChange],
    );
    const serverPort = useMemo(() => {
        if (!data.server?.enabled || !data.server.config?.url) {
            return null;
        }
        const portSplitParts = data.server.config.url.split(":");
        if (portSplitParts.length < 2) {
            return null;
        }
        const lastPart = portSplitParts[portSplitParts.length - 1];
        if (!lastPart) {
            return null;
        }
        const parsed = parseInt(lastPart, 10);
        return isNaN(parsed) ? null : parsed;
    }, [data.server?.enabled, data.server?.config?.url]);
    const onServerPortChange = useCallback(
        (value: number | null) => {
            const url = value !== null ? `http://0.0.0.0:${value}` : null;
            onDataChange({
                server: {
                    ...data.server,
                    config: {
                        ...(data.server.config || {}),
                        url,
                    },
                },
            });
        },
        [data.server, onDataChange],
    );
    return (
        <div className="agent-panel agent-remote-panel">
            {/* Toggle Enable server */}
            <InfoCheckbox
                label="Include Server"
                info="When enabled, a remote agent will also be generated and a remote agent server will start when the flow starts."
                checked={data.server.enabled}
                onChange={onServerEnabledChange}
                id={`agent-remote-server-enable-toggle-${id}`}
                aria-label="Also setup the remote server."
            />
            <div className="margin-top--10" />
            {!data.server.enabled ? (
                <TextInput
                    name="url"
                    value={data.client.url || ""}
                    placeholder="http://localhost:8000"
                    label="Server URL:"
                    onChange={onUrlChange}
                />
            ) : (
                <NumberInput
                    className="margin-top--10"
                    name="server_port"
                    label="Server port:"
                    value={serverPort}
                    onChange={onServerPortChange}
                    min={1024}
                    max={65535}
                    setNullOnLower
                    onLowerLabel="Use a random port"
                />
            )}
            <div className="margin-top--10" />
            <NumberInput
                name="Max Reconnects"
                label="Max Reconnects:"
                value={data.client.maxReconnects || null}
                onChange={onMaxReconnectsChange}
                min={0}
                max={1000}
                setNullOnLower
                onLowerLabel="No limit"
            />
            <NumberInput
                name="Polling interval"
                label="Polling interval (seconds):"
                value={data.client.pollingInterval || null}
                onChange={onPollingIntervalChange}
                min={0}
                max={120}
                step={0.5}
                setNullOnLower
                onLowerLabel="Not set (use default)"
            />
            <div className="margin-top-10" />
            <InfoCheckbox
                label="Silent"
                info="Whether to print the message sent to the server."
                checked={data.client.silent || false}
                onChange={onSilentChange}
                id={`agent-remote-client-toggle-${id}`}
                aria-label="Enable verbose output"
            />
            <div className="margin-top--10" />
            <Dict
                items={data.client.headers || {}}
                itemsType="remote-client-headers"
                viewLabel="Custom headers:"
                onAdd={onAddHeader}
                onUpdate={onUpdateHeaders}
                onDelete={onDeleteHeader}
                areValuesSecret
                allowEmptyValues
            />
        </div>
    );
});

WaldiezAgentRemoteTab.displayName = "WaldiezAgentRemoteTab";
