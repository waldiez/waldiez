/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { memo, useCallback, useMemo } from "react";

import Slider from "rc-slider";

import { InfoLabel } from "@waldiez/components/infoLabel";

type NumberInputProps = {
    label: string | React.JSX.Element;
    value: number | null;
    min: number;
    max: number;
    onChange: (value: number | null) => void;
    forceInt?: boolean;
    onNull?: number;
    onUpperLabel?: string | null;
    onLowerLabel?: string | null;
    setNullOnUpper?: boolean;
    setNullOnLower?: boolean;
    step?: number;
    stepDownScale?: number;
    disabled?: boolean;
    labelInfo?: string | React.JSX.Element | null;
    dataTestId?: string;
};

/**
 * A slider input component with numeric value display and optional min/max labels
 */
export const NumberInput = memo<NumberInputProps>((props: NumberInputProps) => {
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

    // Calculate null value based on props
    const onNullValue = useMemo(
        () => ((onNull ?? setNullOnLower) ? min : setNullOnUpper ? max : min),
        [onNull, setNullOnLower, setNullOnUpper, min, max],
    );

    // Determine current display value
    const currentValue = useMemo(() => (value !== null ? value : onNullValue), [value, onNullValue]);

    // Handle slider change
    const handleChange = useCallback(
        (newValue: number | number[]) => {
            if (Array.isArray(newValue)) {
                return;
            }

            if (newValue === max && setNullOnUpper) {
                onChange(null);
            } else if (newValue === min && setNullOnLower) {
                onChange(null);
            } else {
                onChange(newValue);
            }
        },
        [onChange, max, min, setNullOnUpper, setNullOnLower],
    );

    // Handle input change
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            try {
                const newValue = forceInt ? parseInt(e.target.value, 10) : parseFloat(e.target.value);

                if (!isNaN(newValue)) {
                    handleChange(newValue);
                }
            } catch (_) {
                // Silently ignore parse errors
            }
        },
        [forceInt, handleChange],
    );

    // Generate the label value content
    const getLabelValue = useCallback(() => {
        // Show upper limit label when value is at max or null
        if ((value === max || value === null) && (setNullOnUpper || onUpperLabel !== null)) {
            return onUpperLabel ?? "No limit";
        }
        // Show lower limit label when value is at min or null
        else if ((value === min || value === null) && (setNullOnLower || onLowerLabel !== null)) {
            return onLowerLabel ?? "Not set";
        }
        // Show input field
        else {
            return (
                <input
                    placeholder={`${currentValue}`}
                    inputMode="decimal"
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={handleInputChange}
                    data-testid={dataTestId}
                />
            );
        }
    }, [
        value,
        min,
        max,
        currentValue,
        step,
        onUpperLabel,
        onLowerLabel,
        setNullOnUpper,
        setNullOnLower,
        handleInputChange,
        dataTestId,
    ]);

    // Render label with or without info tooltip
    const renderLabel = useMemo(() => {
        const labelValue = getLabelValue();

        if (labelInfo) {
            return (
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
            );
        }

        return (
            <div className="number-input-label-wrapper">
                <label>
                    {label} {labelValue}
                </label>
            </div>
        );
    }, [label, getLabelValue, labelInfo]);

    return (
        <>
            {renderLabel}
            <Slider
                min={min}
                max={max}
                step={step}
                value={currentValue}
                onChange={handleChange}
                disabled={disabled}
            />
        </>
    );
});

// Add display name for better debugging
NumberInput.displayName = "NumberInput";
