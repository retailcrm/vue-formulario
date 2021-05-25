import regexForFormat from '@/utils/regexForFormat'

describe('regexForFormat', () => {
    test('allows MM format with other characters', () => {
        expect(regexForFormat('abc/MM').test('abc/01')).toBe(true)
    })

    test('fails MM format with single digit', () => {
        expect(regexForFormat('abc/MM').test('abc/1')).toBe(false)
    })

    test('allows M format with single digit', () => {
        expect(regexForFormat('M/abc').test('1/abc')).toBe(true)
    })

    test.each([
        ['13/abc'],
        ['55/abc'],
    ])('fails M format when out of range', (string) => {
        expect(regexForFormat('M/abc').test(string)).toBe(false)
    })

    test('replaces double digits before singles', () => {
        expect(regexForFormat('MMM').test('313131')).toBe(false)
    })

    test('allows DD format with zero digit', () => {
        const regex = regexForFormat('xyz/DD')

        expect(regex.test('xyz/01')).toBe(true)
        expect(regex.test('xyz/9')).toBe(false)
    })

    test('allows D format with single digit', () => {
        expect(regexForFormat('xyz/D').test('xyz/9')).toBe(true)
    })

    test.each([
        ['xyz/92'],
        ['xyz/32'],
    ])('fails D format with out of range digit', string => {
        expect(regexForFormat('xyz/D').test(string)).toBe(false)
    })

    test.each([
        ['00', true],
        ['0000', false],
    ])('allows YY format', (string, matches) => {
        expect(regexForFormat('YY').test(string)).toBe(matches)
    })

    test('allows YYYY format with four zeros', () => {
        expect(regexForFormat('YYYY').test('0000')).toBe(true)
    })

    test.each([
        ['MD-YY', '12-00'],
        ['DM-YY', '12-00'],
    ])('allows $format', (format, string) => {
        expect(regexForFormat(format).test(string)).toBe(true)
    })

    test.each([
        ['MM/DD/YYYY', '12/18/1987'],
        ['YYYY-MM-DD', '1987-01-31']
    ])('$date matches $format', (format, date) => {
        expect(regexForFormat(format).test(date)).toBe(true)
    })

    test('Fails date like YYYY-MM-DD with out of bounds day', () => {
        expect(regexForFormat('YYYY-MM-DD').test('1987-01-32')).toBe(false)
    })
})
