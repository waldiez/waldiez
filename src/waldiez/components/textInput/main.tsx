/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { InfoLabel } from "@waldiez/components/infoLabel";
import { TextInputProps } from "@waldiez/components/textInput/types";

export const TextInput = (props: TextInputProps) => {
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
            {labelInfo ? <InfoLabel label={label} info={labelInfo} /> : <label>{label}</label>}
            <div className="flex">
                <input
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
