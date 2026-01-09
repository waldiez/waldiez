/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type ReactNode, memo, useCallback, useEffect, useState } from "react";

type CollapsibleProps = {
    title: string;
    className?: string;
    contentClassName?: string;
    children: ReactNode;
    expanded?: boolean;
    fullWidth?: boolean;
    dataTestId?: string;
};

/**
 * Collapsible component that can show/hide content
 */
export const Collapsible = memo<CollapsibleProps>(props => {
    const {
        title,
        children,
        dataTestId,
        fullWidth = false,
        expanded = false,
        className = "",
        contentClassName = "",
    } = props;

    const [isOpen, setIsOpen] = useState(expanded);

    // Sync with external expanded prop
    useEffect(() => {
        setIsOpen(expanded);
    }, [expanded]);

    // Memoize toggle handler
    const onToggle = useCallback(() => {
        setIsOpen(prevIsOpen => !prevIsOpen);
    }, []);

    // Calculate CSS classes once
    const containerClassName = `collapsible ${fullWidth ? "w-full" : ""} ${className}`.trim();
    const headerClassName = `collapsible-header ${className}`.trim();

    return (
        <div className={containerClassName} data-testid={dataTestId}>
            <div className={headerClassName} onClick={onToggle}>
                <span>{title}</span>
                <span className="margin-left-5" aria-hidden="true">
                    {isOpen ? "▲" : "▼"}
                </span>
            </div>
            {isOpen && <div className={`collapsible-content ${contentClassName || ""}`}>{children}</div>}
        </div>
    );
});

Collapsible.displayName = "Collapsible";
