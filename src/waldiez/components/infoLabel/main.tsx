/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaInfoCircle } from "react-icons/fa";

type InfoLabelProps = {
    label: string | React.JSX.Element | (() => React.JSX.Element | string);
    info: string | React.JSX.Element | (() => React.JSX.Element | string);
};
export const InfoLabel: React.FC<InfoLabelProps> = (props: InfoLabelProps) => {
    const { label, info } = props;
    // we show the info on hover (css), to show on `icon click`, use state.
    // const [showDescription, setShowDescription] = useState(false);
    const labelElement = typeof label === "function" ? label() : label;
    const infoElement = typeof info === "function" ? info() : info;
    return (
        <div className="info-label">
            <label>{labelElement}</label>
            <FaInfoCircle className="info-icon" />
            <div
                // className={`info-description ${
                //     showDescription ? 'info-description show' : ''
                // }`}
                className="info-description"
            >
                {infoElement}
            </div>
        </div>
    );
};

InfoLabel.displayName = "InfoLabel";
