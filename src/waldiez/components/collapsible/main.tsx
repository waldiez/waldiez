/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { CollapsibleProps } from "@waldiez/components/collapsible/types";

export const Collapsible = (props: CollapsibleProps) => {
    const { title, children, dataTestId, fullWidth = false, expanded = false } = props;
    const [isOpen, setIsOpen] = useState(expanded);

    useEffect(() => {
        setIsOpen(expanded);
    }, [expanded]);

    const onToggle = () => {
        setIsOpen(!isOpen);
    };
    return (
        <div className={`collapsible ${fullWidth && "full-width"}`} data-testid={dataTestId}>
            <div className="collapsible-header" onClick={onToggle}>
                <span>{title}</span>
                <span className="margin-left-5">{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && <div className="collapsible-content">{children}</div>}
        </div>
    );
};
