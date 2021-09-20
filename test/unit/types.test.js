import {
    isRecordLike,
    isScalar,
} from '@/types'

describe('types', () => {
    const scalars = [
        ['booleans', false],
        ['numbers', 123],
        ['strings', 'hello'],
        ['symbols', Symbol(123)],
        ['undefined', undefined],
        ['null', null],
    ]

    const records = [
        [{}],
        [{ constructor: null }],
        [{ a: 'a', b: ['b'] }],
        [[]],
        [['b', 'c']],
    ]

    describe('isRecordLike', () => {
        test.each(records)('passes on records', record => {
            expect(isRecordLike(record)).toBe(true)
        })

        test.each(scalars)('fails on $type', (type, scalar) => {
            expect(isRecordLike(scalar)).toBe(false)
        })

        test.each([
            ['class instance', new class {} ()],
            ['builtin Date instance', new Date()],
        ])('fails on $type', (type, instance) => {
            expect(isRecordLike(instance)).toBe(false)
        })
    })

    describe('isScalar', () => {
        test.each(scalars)('passes on $type', (type, scalar) => {
            expect(isScalar(scalar)).toBe(true)
        })

        test.each(records)('fails on records & arrays', record => {
            expect(isScalar(record)).toBe(false)
        })
    })
})
