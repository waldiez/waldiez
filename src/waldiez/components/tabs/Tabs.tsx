/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactElement, useState } from "react";

type TabItemProps = {
    id: string;
    label: string;
    children: React.ReactNode;
};
type TabItemsProps = {
    activeTabIndex: number;
    children: React.ReactNode;
};
export const TabItem: React.FC<TabItemProps> = (props: TabItemProps) => {
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
export const TabItems: React.FC<TabItemsProps> = (props: TabItemsProps) => {
    const { activeTabIndex, children } = props;
    const [activeTab, setActiveTab] = useState(activeTabIndex);
    const handleTabClick = (index: number) => {
        setActiveTab(index);
    };
    const tabs = React.Children.toArray(children).filter(
        (child): child is ReactElement<TabItemProps> => React.isValidElement(child) && child.type === TabItem,
    );
    return (
        <div className="tabs">
            <nav className="tab-list-wrapper">
                <ul className="tab-list" role="tablist" aria-orientation="horizontal">
                    {tabs.map((tab, index) => {
                        const className = activeTab === index ? "tab-btn--active" : "";
                        return (
                            <li key={`tab-li-${tab.props.id}-${index}`} tabIndex={index} role="tab">
                                <div
                                    role="button"
                                    key={`tab-btn-${tab.props.id}-${index}`}
                                    data-testid={`tab-id-${tab.props.id}`}
                                    id={`tab-id-${tab.props.id}`}
                                    aria-controls={`panel-${tab.props.id}`}
                                    // aria-selected={activeTab === index} //hint complains about this :(
                                    onClick={handleTabClick.bind(null, index)}
                                    className={`tab-btn ${className}`}
                                >
                                    {tab.props.label}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {tabs[activeTab]}
        </div>
    );
};
