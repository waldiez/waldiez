/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaInfoCircle } from "react-icons/fa";

type InfoCheckboxProps = {
    label: string | React.JSX.Element | (() => React.JSX.Element | string);
    info: string | React.JSX.Element | (() => React.JSX.Element | string);
    checked: boolean;
    dataTestId: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
export const InfoCheckbox: React.FC<InfoCheckboxProps> = (props: InfoCheckboxProps) => {
    const { label, info, checked, dataTestId, onChange } = props;
    const labelElement = typeof label === "function" ? label() : label;
    const infoElement = typeof info === "function" ? info() : info;
    return (
        <div className="info-label tooltip-bottom">
            <label className="checkbox-label">
                <div className="checkbox-label-view">{labelElement}</div>
                <input type="checkbox" checked={checked} onChange={onChange} data-testid={dataTestId} />
                <div className="checkbox"></div>
            </label>
            <FaInfoCircle className="info-icon" />
            <div className="info-description">{infoElement}</div>
        </div>
    );
};
