/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import Slider from "rc-slider";

import { InfoLabel } from "@waldiez/components/infoLabel";
import { NumberInputProps } from "@waldiez/components/numberInput/types";

export const NumberInput = (props: NumberInputProps) => {
    const {
        value,
        label,
        onChange,
        onNull,
        onUpperLabel = null,
        onLowerLabel = null,
        setNullOnUpper = false,
        setNullOnLower = false,
        labelInfo = null,
        min = 0,
        max = 100,
        step = 1,
        forceInt = false,
        disabled = false,
        dataTestId,
    } = props;

    const handleChange = (value: number | number[]) => {
        if (Array.isArray(value)) {
            return;
        }
        if (value === max && setNullOnUpper) {
            onChange(null);
        } else if (value === min && setNullOnLower) {
            onChange(null);
        } else {
            onChange(value);
        }
    };
    const onNullValue = (onNull ?? setNullOnLower) ? min : setNullOnUpper ? max : min;
    const getLabelValue = () => {
        if (
            (value === max || value === null || value === undefined) &&
            (setNullOnUpper || onUpperLabel !== null)
        ) {
            return onUpperLabel ?? "No limit";
        } else if (
            (value === min || value === null || value === undefined) &&
            (setNullOnLower || onLowerLabel !== null)
        ) {
            return onLowerLabel ?? "Not set";
        } else {
            return (
                <input
                    placeholder={value !== null ? `${value}` : `${onNullValue}`}
                    inputMode="decimal"
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value !== null ? value : onNullValue}
                    onChange={e => {
                        try {
                            const newValue = forceInt
                                ? parseInt(e.target.value, 10)
                                : parseFloat(e.target.value);
                            handleChange(newValue);
                        } catch (_) {
                            return;
                        }
                    }}
                    data-testid={dataTestId}
                ></input>
            );
        }
    };

    const labelView = () => {
        const labelValue = getLabelValue();
        return labelInfo ? (
            <div className="number-input-info-label-wrapper">
                <InfoLabel
                    label={
                        <div className="number-input-info-label-inner">
                            {label}&nbsp;&nbsp;{labelValue}
                        </div>
                    }
                    info={labelInfo}
                />
            </div>
        ) : (
            <div className="number-input-label-wrapper">
                <label>
                    {label} {labelValue}
                </label>
            </div>
        );
    };
    return (
        <>
            {labelView()}
            <Slider
                min={min}
                max={max}
                step={step}
                value={value !== null ? value : onNullValue}
                onChange={handleChange}
                disabled={disabled}
            />
        </>
    );
};
