/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TabItemProps } from "@waldiez/components/tabs/types";

export const TabItem = (props: TabItemProps) => {
    const { id, label, children } = props;
    return (
        <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby={`${label}-Tab`}
            data-testid={`panel-${id}`}
            id={`panel-${id}`}
        >
            {children}
        </div>
    );
};
