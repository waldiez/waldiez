import { fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import { default as eslint, default as eslintJs } from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import headers from "eslint-plugin-headers";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginTsDoc from "eslint-plugin-tsdoc";
import path from "path";
import eslintTs from "typescript-eslint";
import { fileURLToPath } from "url";

// https://github.com/import-js/eslint-plugin-import/issues/2948#issuecomment-2148832701
const project = "./tsconfig.app.json";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: eslintJs.configs.recommended,
});

function legacyPlugin(name, alias = name) {
    const plugin = compat.plugins(name)[0]?.plugins?.[alias];

    if (!plugin) {
        throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
    }

    return fixupPluginRules(plugin);
}

const defaultConfig = eslintTs.config({
    files: ["src/**/*.{ts,tsx}"],
    extends: [
        eslint.configs.recommended,
        ...eslintTs.configs.recommended,
        ...compat.extends("plugin:import/typescript"),
        eslintPluginPrettierRecommended,
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
        import: legacyPlugin("eslint-plugin-import", "import"),
        tsdoc: eslintPluginTsDoc,
        headers,
    },
    rules: {
        "prettier/prettier": [
            // also check package.json for prettier config
            "error",
            {
                tabWidth: 4,
                printWidth: 110,
                arrowParens: "avoid",
                bracketSpacing: true,
                singleQuote: false,
                trailingComma: "all",
                endOfLine: "lf",
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
                allowTemplateLiterals: false,
            },
        ],
        curly: ["error", "all"],
        eqeqeq: "error",
        "prefer-arrow-callback": "error",
        "tsdoc/syntax": "warn",
        complexity: ["error", 20],
        "max-depth": ["error", 4],
        "max-nested-callbacks": ["error", 4],
        "max-statements": ["error", 11, { ignoreTopLevelFunctions: true }],
        "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
        "max-lines-per-function": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
        "headers/header-format": [
            "error",
            {
                source: "string",
                content:
                    "SPDX-License-Identifier: {spdxIdentifier}\nCopyright {startYear} - {currentYear} {owner}",
                variables: {
                    spdxIdentifier: "Apache-2.0",
                    startYear: "2024",
                    currentYear: `${new Date().getFullYear()}`,
                    owner: "Waldiez & contributors",
                },
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
            complexity: ["error", 20],
            "max-statements": ["error", 20, { ignoreTopLevelFunctions: true }],
        },
    })),
];
