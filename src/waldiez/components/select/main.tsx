/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// react-select with common styles
import React, { JSX, forwardRef } from "react";
import ReactSelect, { GroupBase, MultiValue, Props, SelectInstance, SingleValue } from "react-select";

export type { GroupBase, MultiValue, SingleValue };

type SelectComponent = <
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(
    props: Props<Option, IsMulti, Group> & {
        ref?: React.Ref<SelectInstance<Option, IsMulti, Group>>;
    },
) => JSX.Element;

export const Select = forwardRef(
    <Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
        props: Props<Option, IsMulti, Group>,
        ref: React.Ref<SelectInstance<Option, IsMulti, Group>>,
    ) => {
        return (
            <ReactSelect
                ref={ref}
                {...props}
                className="select"
                classNamePrefix="w-select"
                menuPosition="fixed"
                styles={{
                    menu: provided => ({
                        ...provided,
                        zIndex: 9999,
                        width: "max-content",
                        minWidth: "100%",
                    }),
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                }}
            />
        );
    },
) as SelectComponent;
