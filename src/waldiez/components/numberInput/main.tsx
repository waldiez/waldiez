/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import * as Slider from "@radix-ui/react-slider";

import { type ChangeEvent, type JSX, memo, useCallback, useMemo } from "react";

import { InfoLabel } from "@waldiez/components/infoLabel";

type NumberInputProps = {
    name: string;
    label: string | JSX.Element;
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
    labelInfo?: string | JSX.Element | null;
    dataTestId?: string;
};

/**
 * A slider input component with numeric value display and optional min/max labels
 */
export const NumberInput = memo<NumberInputProps>((props: NumberInputProps) => {
    const {
        name,
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
    const handleSliderChange = useCallback(
        (newValues: number[]) => {
            const newValue = newValues[0];

            // noinspection SuspiciousTypeOfGuard
            if (typeof newValue !== "number") {
                return;
            }
            if (newValue === max && setNullOnUpper) {
                onChange(null);
            } else if (newValue === min && setNullOnLower) {
                onChange(null);
            } else {
                onChange(forceInt ? Math.round(newValue) : newValue);
            }
        },
        [onChange, max, min, setNullOnUpper, setNullOnLower, forceInt],
    );

    // Handle input change
    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            try {
                const newValue = forceInt ? parseInt(e.target.value, 10) : parseFloat(e.target.value);

                if (!isNaN(newValue)) {
                    handleSliderChange([newValue]);
                }
            } catch (_) {
                // Silently ignore parse errors
            }
        },
        [forceInt, handleSliderChange],
    );

    // Generate the label value content
    const getLabelValue = useCallback(() => {
        // Show upper limit label when value is at max or null
        if ((value === max || value === null) && (setNullOnUpper || onUpperLabel !== null)) {
            return <span className="margin-left-5">{onUpperLabel ?? "No limit"}</span>;
        }
        // Show lower limit label when value is at min or null
        else if ((value === min || value === null) && (setNullOnLower || onLowerLabel !== null)) {
            return <span className="margin-left-5">{onLowerLabel ?? "Not set"}</span>;
        }
        // Show input field
        else {
            return (
                <span className="margin-left-5 margin-bottom-5">
                    <input
                        id={`id-for-${name}`}
                        name={name}
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
                </span>
            );
        }
    }, [
        name,
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
        if (labelInfo) {
            return (
                <div className="number-input-info-label-wrapper">
                    <InfoLabel htmlFor={`id-for-${name}`} label={label} info={labelInfo}>
                        {getLabelValue()}
                    </InfoLabel>
                </div>
            );
        }

        return (
            <div className="number-input-label-wrapper">
                <label htmlFor={`id-for-${name}`}>
                    {label} {getLabelValue()}
                </label>
            </div>
        );
    }, [name, label, getLabelValue, labelInfo]);

    return (
        <>
            {renderLabel}
            <Slider.Root
                className="slider-root"
                value={[currentValue]}
                max={max}
                step={step}
                min={min}
                onValueChange={handleSliderChange}
                disabled={disabled}
            >
                <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
        </>
    );
});

NumberInput.displayName = "NumberInput";
