import { isScalar } from '@/utils/types'

describe('isScalar', () => {
    const expectIsScalar = value => expect(isScalar(value)).toBe(true)

    test('passes on booleans', () => expectIsScalar(false))
    test('passes on numbers', () => expectIsScalar(123))
    test('passes on strings', () => expectIsScalar('hello'))
    test('passes on symbols', () => expectIsScalar(Symbol(123)))
    test('passes on undefined', () => expectIsScalar(undefined))
    test('passes on null', () => expectIsScalar(null))

    test('fails on pojo', () => expect(isScalar({})).toBe(false))
})
