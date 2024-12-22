// @ts-check

import cspellPlugin from '@cspell/eslint-plugin';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const customBaseConfig = {
    ...eslint.configs.recommended,
    ignores: ['**/*.js', '**/*.mjs', '**/*.jsx'] // Explicitly ignore .js files
};

export default tseslint.config({
    files: ['scripts/*.ts'],
    extends: [
        customBaseConfig,
        eslintPluginPrettierRecommended,
        ...tseslint.configs.strict,
    ],
    plugins: {
        '@stylistic': stylistic,
        '@cspell': cspellPlugin
    },
    rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                args: 'all',
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@stylistic/no-explicit-any': 'off',
        '@stylistic/no-trailing-spaces': 'off',
        '@stylistic/padded-blocks': 'off',
        '@stylistic/function-paren-newline': 'off',
        '@stylistic/no-use-before-define': 'off',
        complexity: ['error', 11],
        'max-depth': ['error', 4],
        'max-nested-callbacks': ['error', 4],
        'max-statements': ['error', 11, { ignoreTopLevelFunctions: true }],
        '@cspell/spellchecker': ['warn', {}],
        'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
        'max-lines-per-function': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
});
