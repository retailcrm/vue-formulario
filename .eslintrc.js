module.exports = {
    root: true,

    parserOptions: {
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
    },

    plugins: ['@typescript-eslint'],

    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    extends: [
        'standard',
        '@vue/standard',
        '@vue/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/recommended',
    ],

    env: {
        browser: true,
    },

    rules: {
        '@typescript-eslint/camelcase': ['error', {
            allow: ['^__Formulario'],
        }],
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off', // @TODO
        '@typescript-eslint/no-unused-vars': ['error'], // @TODO
        'arrow-parens': 0,
        'comma-dangle': ['error', 'only-multiline'],
        'indent': ['error', 4, { SwitchCase: 1 }],
        'max-depth': ['error', 3],
        'max-lines-per-function': ['error', 40],
        'no-console': ['warn', {allow: ['warn', 'error']}],
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        'no-unused-vars': 'off',
        'vue/html-closing-bracket-spacing': ['error', {
            startTag: 'never',
            endTag: 'never',
            selfClosingTag: 'always',
        }],
        'vue/html-indent': ['error', 4, {
            attribute: 1,
            closeBracket: 0,
            alignAttributesVertically: true,
            ignores: [],
        }],
    },

    overrides: [{
        files: ['*/**/shims-*.d.ts'],
        rules: {
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    }, {
        files: ['*.js', '*.tale.vue'],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    }, {
        files: ['*.config.js'],
        rules: {
            '@typescript-eslint/camelcase': 'off',
        }
    }],
}
