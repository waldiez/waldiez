/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import stylistic from "@stylistic/eslint-plugin";
import headers from "eslint-plugin-headers";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginTsDoc from "eslint-plugin-tsdoc";
import eslintTs from "typescript-eslint";

const owner = "Waldiez";
const startYear = 2024;
const spdxIdentifier = "Apache-2.0";
const currentYear = new Date().getFullYear();
const ownerAndContributors = `${owner} & contributors`;

const project = "./tsconfig.app.json";

// noinspection JSCheckFunctionSignatures
const defaultConfig = eslintTs.config({
    files: ["src/**/*.{ts,tsx}"],
    extends: [
        ...eslintTs.configs.recommended,
        eslintPluginPrettierRecommended,
        cspellESLintPluginRecommended,
        importPlugin.flatConfigs.typescript,
    ],
    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
                project,
            },
            node: true,
        },
    },
    plugins: {
        "@stylistic": stylistic,
        "react-refresh": eslintPluginReactRefresh,
        tsdoc: eslintPluginTsDoc,
        "react-hooks": reactHooks,
        headers,
    },
    rules: {
        "prettier/prettier": [
            "error",
            {
                tabWidth: 4,
                printWidth: 110,
                arrowParens: "avoid",
                bracketSpacing: true,
                singleQuote: false,
                trailingComma: "all",
                endOfLine: "lf",
                plugins: ["@trivago/prettier-plugin-sort-imports"],
                importOrderSeparation: true,
                importOrderSortSpecifiers: true,
                importOrder: [
                    "^@fortawesome/",
                    "^@xyflow/",
                    "^react",
                    "^react-dom",
                    "^react-select",
                    "^zustand",
                    "^nanoid",
                    "^@monaco-editor/react",
                    "^@waldiez/",
                    "^[./]",
                ],
                overrides: [
                    {
                        files: ["**/*.yml", "**/*.yaml", "**/*.md", "**/*.css"],
                        options: {
                            tabWidth: 2,
                        },
                    },
                ],
            },
        ],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: "interface",
                format: ["PascalCase"],
                custom: {
                    regex: "^I[A-Z]",
                    match: true,
                },
            },
        ],
        "react-hooks/exhaustive-deps": "warn",
        "react-hooks/rules-of-hooks": "error",
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                args: "all",
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@stylistic/no-explicit-any": "off",
        "@stylistic/no-trailing-spaces": "off",
        "@stylistic/padded-blocks": "off",
        "@stylistic/function-paren-newline": "off",
        "@stylistic/no-use-before-define": "off",
        "@stylistic/quotes": [
            "error",
            "double",
            {
                avoidEscape: true,
                allowTemplateLiterals: "never",
            },
        ],
        curly: ["error", "all"],
        eqeqeq: "error",
        "prefer-arrow-callback": "error",
        "tsdoc/syntax": "warn",
        complexity: ["error", 20],
        "max-depth": ["error", 4],
        "max-nested-callbacks": ["error", 4],
        "max-statements": ["error", 15, { ignoreTopLevelFunctions: true }],
        "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
        "max-lines-per-function": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
        "headers/header-format": [
            "error",
            {
                source: "string",
                content: "{licenseLine}\n{copyRightLine}",
                variables: {
                    licenseLine: `SPDX-License-Identifier: ${spdxIdentifier}`,
                    copyRightLine: `Copyright ${startYear} - ${currentYear} ${ownerAndContributors}`,
                },
            },
        ],
        "@cspell/spellchecker": [
            "warn",
            {
                configFile: "cspell.json",
            },
        ],
    },
});

export default [
    {
        ignores: [
            "node_modules",
            "dist",
            "out",
            "lib",
            "public",
            ".local",
            ".hatch",
            ".tox",
            ".venv",
            "**/assets/**",
            "**/.venv/**",
            "**/*.js",
        ],
    },
    ...defaultConfig.map(config => ({
        ...config,
        files: ["**/*.{ts,tsx}"],
    })),
    ...defaultConfig.map(config => ({
        ...config,
        files: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}"],
    })),
    // overrides
    ...defaultConfig.map(config => ({
        ...config,
        files: ["src/waldiez/store/**/*.ts"],
        rules: {
            ...config.rules,
            "max-statements": ["error", 20, { ignoreTopLevelFunctions: true }],
        },
    })),
    ...defaultConfig.map(config => ({
        ...config,
        files: ["src/tests/**/*.{ts,tsx}"],
        rules: {
            ...config.rules,
            complexity: ["error", 30],
            "max-statements": ["error", 50, { ignoreTopLevelFunctions: true }],
            "max-depth": ["error", 10],
            "max-nested-callbacks": ["error", 10],
            "max-lines": ["error", { max: 1000, skipBlankLines: true, skipComments: true }],
            "max-lines-per-function": ["error", { max: 1000, skipBlankLines: true, skipComments: true }],
        },
    })),
];
