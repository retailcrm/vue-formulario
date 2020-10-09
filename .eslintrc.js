module.exports = {
    root: true,

    parserOptions: {
        parser: 'babel-eslint',
        sourceType: 'module',
    },

    // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
    extends: [
        'standard',
        '@vue/standard',
        'plugin:vue/recommended',
    ],

    env: {
        browser: true,
    },

    rules: {
        // allow paren-less arrow functions
        'arrow-parens': 0,
        'comma-dangle': ['error', 'only-multiline'],
        'indent': ['error', 4],
        'max-depth': ['error', 3],
        'max-lines-per-function': ['error', 40],
        'no-console': ['warn', {allow: ['warn', 'error']}],
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
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
}
