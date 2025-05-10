/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelData } from "@waldiez/models/Model/ModelData";
import { getId } from "@waldiez/utils";

/**
 * Waldiez Model
 * @param type - The type (model)
 * @param id - The ID
 * @param name - The name of the model
 * @param description - The description of the model
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezModelData}
 */
export class WaldiezModel {
    type = "model";
    id: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezModelData;
    rest?: { [key: string]: unknown } = {};

    constructor(props: {
        id: string;
        data: WaldiezModelData;
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

    static create(): WaldiezModel {
        return new WaldiezModel({
            id: `wt-${getId()}`,
            name: "Model",
            description: "A new model",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: new WaldiezModelData(),
        });
    }
}
