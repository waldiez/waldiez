/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs-extra";
import path from "path";
import tsj from "ts-json-schema-generator";
import url from "url";

import packageJson from "../package.json";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repositoryUrl = packageJson.repository.url
    .replace(".git", "")
    .replace("github.com", "raw.githubusercontent.com");
const schemaId = `${repositoryUrl}/tree/tags/v${packageJson.version}/schema.json`;
const config: tsj.Config = {
    tsconfig: "tsconfig.docs.json",
    type: "WaldiezFlowSchema",
    expose: "export" as "all" | "none" | "export",
    jsDoc: "extended" as "none" | "extended" | "basic",
    schemaId,
    skipTypeCheck: false,
    topRef: false,
    additionalProperties: false,
};

const schema = tsj.createGenerator(config).createSchema(config.type);
schema.title = "Waldiez Flow";
schema.description = "The schema for a Waldiez Flow";
const schemaString = JSON.stringify(schema, null, 2);
const outputPath = path.resolve(__dirname, "..", "schema.json");
fs.writeFile(outputPath, schemaString, err => {
    if (err) {
        throw err;
    }
    console.info(`Schema written to ${outputPath}`);
});
