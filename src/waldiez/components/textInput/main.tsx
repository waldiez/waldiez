/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { InfoLabel } from "@waldiez/components/infoLabel";

type TextInputProps = {
    label: string | React.JSX.Element;
    value: string | null;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    onNull?: string;
    disabled?: boolean;
    labelInfo?: string | React.JSX.Element;
    dataTestId?: string;
    style?: React.CSSProperties;
    isPassword?: boolean;
    fullWidth?: boolean;
    className?: string;
};

export const TextInput: React.FC<TextInputProps> = (props: TextInputProps) => {
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
        className = undefined,
        isPassword = false,
        fullWidth = false,
    } = props;

    const [visible, setVisible] = useState(false);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!disabled) {
            onChange(event);
        }
    };
    const toggleVisibility = () => {
        setVisible(prev => !prev);
    };
    return (
        <>
            {labelInfo ? (
                <InfoLabel label={label} info={labelInfo} />
            ) : typeof label === "string" ? (
                <label>{label}</label>
            ) : (
                label
            )}
            <div className="flex">
                <input
                    className={className}
                    placeholder={placeholder}
                    type={isPassword ? (visible ? "text" : "password") : "text"}
                    value={value !== null ? value : onNull}
                    onChange={handleChange}
                    disabled={disabled}
                    data-testid={dataTestId}
                    style={fullWidth ? { flex: "1", ...style } : { ...style }}
                ></input>
                {isPassword && (
                    <button
                        type="button"
                        className="visibilityWrapperBtn margin-left-5"
                        onClick={toggleVisibility}
                        title="Toggle visibility"
                        data-testid={`visibility-${dataTestId}`}
                    >
                        {visible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
            </div>
        </>
    );
};
