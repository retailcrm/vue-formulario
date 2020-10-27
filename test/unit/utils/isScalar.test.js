import isScalar from '@/utils/isScalar'

describe('isScalar', () => {
    it('Passes on strings', () => expect(isScalar('hello')).toBe(true))

    it('Passes on numbers', () => expect(isScalar(123)).toBe(true))

    it('Passes on booleans', () => expect(isScalar(false)).toBe(true))

    it('Passes on symbols', () => expect(isScalar(Symbol(123))).toBe(true))

    it('Passes on null', () => expect(isScalar(null)).toBe(true))

    it('Passes on undefined', () => expect(isScalar(undefined)).toBe(true))

    it('Fails on pojo', () => expect(isScalar({})).toBe(false))
})
