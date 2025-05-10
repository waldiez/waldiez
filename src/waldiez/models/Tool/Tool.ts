/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezToolData } from "@waldiez/models/Tool/ToolData";
import { getId } from "@waldiez/utils";

/**
 * Waldiez Tool
 * @param type - The type (tool)
 * @param id - The ID
 * @param name - The name of the tool
 * @param description - The description of the tool
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezToolData}
 */
export class WaldiezTool {
    type = "tool";
    id: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezToolData;
    rest?: { [key: string]: unknown } = {};

    constructor(props: {
        id: string;
        data: WaldiezToolData;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        rest?: { [key: string]: unknown };
    }) {
        this.id = props.id;
        this.name = props.name;
        this.description = props.description;
        this.tags = props.tags;
        this.requirements = props.requirements;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.data = props.data;
        this.rest = props.rest;
    }

    static create(): WaldiezTool {
        return new WaldiezTool({
            id: `wt-${getId()}`,
            name: "new_tool",
            description: "A new tool",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: new WaldiezToolData(),
        });
    }
}
