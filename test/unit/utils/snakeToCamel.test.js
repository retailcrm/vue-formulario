import snakeToCamel from '@/utils/snakeToCamel'

describe('snakeToCamel', () => {
    test.each([
        ['this_is_snake_case', 'thisIsSnakeCase'],
        ['this_is_snake_case_2nd_example', 'thisIsSnakeCase2ndExample'],
    ])('converts snake_case to camelCase', (raw, expected) => {
        expect(snakeToCamel(raw)).toBe(expected)
    })

    test('Does not capitalize the first word or strip first underscore if a phrase starts with an underscore', () => {
        expect(snakeToCamel('_this_starts_with_an_underscore')).toBe('_thisStartsWithAnUnderscore')
    })

    test.each([
        ['thisIsCamelCase'],
        ['__double__underscores__'],
        ['this-is-kebab-case'],
    ])('has no effect', (raw) => {
        expect(snakeToCamel(raw)).toBe(raw)
    })
})
