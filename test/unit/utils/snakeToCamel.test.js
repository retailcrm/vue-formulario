import snakeToCamel from '@/utils/snakeToCamel'

describe('snakeToCamel', () => {
    it('Converts underscore separated words to camelCase', () => {
        expect(snakeToCamel('this_is_snake_case')).toBe('thisIsSnakeCase')
    })

    it('Converts underscore separated words to camelCase even if they start with a number', () => {
        expect(snakeToCamel('this_is_snake_case_2nd_example')).toBe('thisIsSnakeCase2ndExample')
    })

    it('Has no effect on already camelCase words', () => {
        expect(snakeToCamel('thisIsCamelCase')).toBe('thisIsCamelCase')
    })

    it('Does not capitalize the first word or strip first underscore if a phrase starts with an underscore', () => {
        expect(snakeToCamel('_this_starts_with_an_underscore')).toBe('_thisStartsWithAnUnderscore')
    })

    it('Ignores double underscores anywhere in a word', () => {
        expect(snakeToCamel('__unlikely__thing__')).toBe('__unlikely__thing__')
    })

    it('Has no effect hyphenated words', () => {
        expect(snakeToCamel('not-a-good-name')).toBe('not-a-good-name')
    })
})
