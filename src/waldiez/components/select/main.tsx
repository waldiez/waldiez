/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
// react-select with common styles
import { type JSX, type Ref, forwardRef } from "react";
import type { GroupBase, MultiValue, Props, SelectInstance, SingleValue } from "react-select";
import ReactSelect from "react-select";

export type { GroupBase, MultiValue, SingleValue };

type SelectComponent = <
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
>(
    props: Props<Option, IsMulti, Group> & {
        ref?: Ref<SelectInstance<Option, IsMulti, Group>>;
    },
) => JSX.Element;

export const Select = forwardRef(
    <Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
        props: Props<Option, IsMulti, Group>,
        ref: Ref<SelectInstance<Option, IsMulti, Group>>,
    ) => {
        // noinspection JSUnusedGlobalSymbols
        return (
            <ReactSelect
                ref={ref}
                {...props}
                className={`select ${props.className ? ` ${props.className}` : ""}`}
                classNamePrefix="w-select"
                menuPortalTarget={import.meta.env.VITEST ? undefined : document.body}
                // menuPlacement="auto"
                styles={{
                    menuPortal: base => ({
                        ...base,
                        zIndex: 10001, // Higher than modal
                    }),
                    menu: provided => ({
                        ...provided,
                        zIndex: 10001,
                        width: "max-content",
                        minWidth: "100%",
                    }),
                    ...props.styles, // Allow style overrides
                }}
            />
        );
    },
) as SelectComponent;
