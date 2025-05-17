/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { memo, useCallback, useMemo, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { InfoLabel } from "@waldiez/components/infoLabel";

type TextInputProps = {
    label: string | React.JSX.Element;
    value: string | undefined | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    onNull?: string;
    disabled?: boolean;
    labelInfo?: string | React.JSX.Element | null;
    dataTestId?: string;
    style?: React.CSSProperties;
    isPassword?: boolean;
    fullWidth?: boolean;
    className?: string;
    labelClassName?: string;
};

/**
 * Text input component with optional password visibility toggle and info label
 */
export const TextInput = memo<{
    label: string | React.JSX.Element;
    value: string | undefined | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    onNull?: string;
    disabled?: boolean;
    labelInfo?: string | React.JSX.Element | null;
    dataTestId?: string;
    style?: React.CSSProperties;
    isPassword?: boolean;
    fullWidth?: boolean;
    className?: string;
    labelClassName?: string;
}>((props: TextInputProps) => {
    const {
        label,
        value,
        onChange,
        onNull = "",
        disabled = false,
        labelInfo = null,
        dataTestId = "text-input",
        placeholder = "...",
        style = {},
        className = "",
        isPassword = false,
        fullWidth = false,
        labelClassName = "",
    } = props;

    // State for password visibility
    const [visible, setVisible] = useState(false);

    // Handle input change
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!disabled) {
                onChange(event);
            }
        },
        [disabled, onChange],
    );

    // Toggle password visibility
    const toggleVisibility = useCallback(() => {
        setVisible(prev => !prev);
    }, []);

    // Compute input type based on password setting and visibility
    const inputType = useMemo(
        () => (isPassword ? (visible ? "text" : "password") : "text"),
        [isPassword, visible],
    );

    // Compute input style with fullWidth consideration
    const inputStyle = useMemo(
        () => (fullWidth ? { flex: "1", ...style } : { ...style }),
        [fullWidth, style],
    );

    // Render appropriate label based on prop type and info
    const renderLabel = () => {
        if (labelInfo) {
            return <InfoLabel label={label} info={labelInfo} />;
        }

        if (typeof label === "string") {
            return <label className={labelClassName}>{label}</label>;
        }

        return label;
    };

    return (
        <>
            {renderLabel()}
            <div className="flex">
                <input
                    className={className}
                    placeholder={placeholder}
                    type={inputType}
                    value={value !== null ? value : onNull}
                    onChange={handleChange}
                    disabled={disabled}
                    data-testid={dataTestId}
                    style={inputStyle}
                    aria-label={typeof label === "string" ? label : undefined}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="visibilityWrapperBtn margin-left-5"
                        onClick={toggleVisibility}
                        title={visible ? "Hide password" : "Show password"}
                        aria-label={visible ? "Hide password" : "Show password"}
                        data-testid={`visibility-${dataTestId}`}
                    >
                        {visible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
            </div>
        </>
    );
});

TextInput.displayName = "TextInput";
