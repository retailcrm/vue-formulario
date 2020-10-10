const path = require('path')

module.exports = {
    rootDir: path.resolve(__dirname, '../'),
    moduleFileExtensions: [
        'js',
        'json',
        'ts',
        'vue',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    modulePaths: [
        "<rootDir>"
    ],
    transform: {
        '.*\\.js$': '<rootDir>/node_modules/babel-jest',
        '.*\\.ts$': '<rootDir>/node_modules/ts-jest',
        '.*\\.(vue)$': '<rootDir>/node_modules/jest-vue-preprocessor'
    },
    collectCoverageFrom: [
        "src/*.{js,vue}",
    ],
}
