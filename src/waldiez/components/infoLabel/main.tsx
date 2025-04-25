/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaInfoCircle } from "react-icons/fa";

import { InfoLabelProps } from "@waldiez/components/infoLabel/types";

export const InfoLabel = (props: InfoLabelProps) => {
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
