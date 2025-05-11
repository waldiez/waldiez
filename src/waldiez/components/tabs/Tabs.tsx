/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactElement, memo, useCallback, useMemo, useState } from "react";

type TabItemProps = {
    id: string;
    label: string;
    children: React.ReactNode;
};

type TabItemsProps = {
    activeTabIndex?: number;
    children: React.ReactNode;
    onTabChange?: (index: number) => void;
};

/**
 * Individual tab panel component
 */
export const TabItem = memo<TabItemProps>((props: TabItemProps) => {
    const { id, children } = props;

    return (
        <div
            className="tab-panel"
            role="tabpanel"
            aria-labelledby={`tab-id-${id}`}
            data-testid={`panel-${id}`}
            id={`panel-${id}`}
        >
            {children}
        </div>
    );
});

/**
 * Container component for a set of tabs
 */
export const TabItems = memo<TabItemsProps>((props: TabItemsProps) => {
    const { activeTabIndex = 0, children, onTabChange } = props;

    // Local state for active tab
    const [activeTab, setActiveTab] = useState(activeTabIndex);

    // Update local state when prop changes
    React.useEffect(() => {
        setActiveTab(activeTabIndex);
    }, [activeTabIndex]);

    // Handle tab selection
    const handleTabClick = useCallback(
        (index: number) => {
            setActiveTab(index);
            onTabChange?.(index);
        },
        [onTabChange],
    );

    // Filter and extract valid TabItem children
    const tabs = useMemo(
        () =>
            React.Children.toArray(children).filter(
                (child): child is ReactElement<TabItemProps> =>
                    React.isValidElement(child) && child.type === TabItem,
            ),
        [children],
    );

    // Generate tab buttons
    const tabButtons = useMemo(
        () =>
            tabs.map((tab, index) => {
                const isActive = activeTab === index;
                const className = isActive ? "tab-btn--active" : "";
                const tabId = tab.props.id;

                return (
                    <li key={`tab-li-${tabId}-${index}`} role="tab" aria-selected={isActive}>
                        <div
                            role="button"
                            data-testid={`tab-id-${tabId}`}
                            id={`tab-id-${tabId}`}
                            aria-controls={`panel-${tabId}`}
                            onClick={() => handleTabClick(index)}
                            className={`tab-btn ${className}`}
                            tabIndex={isActive ? 0 : -1}
                        >
                            {tab.props.label}
                        </div>
                    </li>
                );
            }),
        [tabs, activeTab, handleTabClick],
    );

    // Only show active tab content
    const activeTabContent = tabs[activeTab] || null;

    return (
        <div className="tabs">
            <nav className="tab-list-wrapper">
                <ul className="tab-list" role="tablist" aria-orientation="horizontal">
                    {tabButtons}
                </ul>
            </nav>
            {activeTabContent}
        </div>
    );
});

// Add display names for better debugging
TabItem.displayName = "TabItem";
TabItems.displayName = "TabItems";
