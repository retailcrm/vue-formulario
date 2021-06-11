import { deepEquals, shallowEquals } from '@/utils/compare'

class Sample {
    constructor() {
        this.fieldA = 'fieldA'
        this.fieldB = 'fieldB'
    }

    doSomething () {}
}

describe('compare', () => {
    describe('deepEquals', () => {
        test.each`
            type             | a
            ${'booleans'}    | ${false}
            ${'numbers'}     | ${123}
            ${'strings'}     | ${'hello'}
            ${'symbols'}     | ${Symbol(123)}
            ${'undefined'}   | ${undefined}
            ${'null'}        | ${null}
            ${'array'}       | ${[1, 2, 3]}
            ${'pojo'}        | ${{ a: 1, b: 2 }}
            ${'empty array'} | ${[]}
            ${'empty pojo'}  | ${{}}
            ${'date'}        | ${new Date()}
        `('A=A check on $type', ({ a }) => {
            expect(deepEquals(a, a)).toBe(true)
        })

        test.each`
            a                   | b                   | expected
            ${[]}               | ${[]}               | ${true}
            ${[1, 2, 3]}        | ${[1, 2, 3]}        | ${true}
            ${[1, 2, { a: 1 }]} | ${[1, 2, { a: 1 }]} | ${true}
            ${[1, 2, { a: 1 }]} | ${[1, 2, { a: 2 }]} | ${false}
            ${[1, 2, 3]}        | ${[1, 2, 4]}        | ${false}
            ${[1, 2, 3]}        | ${[1, 2]}           | ${false}
            ${[]}               | ${[1, 2]}           | ${false}
            ${{}}               | ${{}}               | ${true}
            ${{ a: 1, b: 2 }}   | ${{ a: 1, b: 2 }}   | ${true}
            ${{ a: 1, b: 2 }}   | ${{ a: 1 }}         | ${false}
            ${{ a: {} }}        | ${{ a: {} }}        | ${true}
            ${{ a: { b: 1 } }}  | ${{ a: { b: 1 } }}  | ${true}
            ${{ a: { b: 1 } }}  | ${{ a: { b: 2 } }}  | ${false}
            ${new Date()}       | ${new Date()}       | ${true}
        `('A=B & B=A check: A=$a, B=$b, expected: $expected', ({ a, b, expected }) => {
            expect(deepEquals(a, b)).toBe(expected)
            expect(deepEquals(b, a)).toBe(expected)
        })

        test('A=B & B=A check for instances', () => {
            const a = new Sample()
            const b = new Sample()

            expect(deepEquals(a, b)).toBe(true)
            expect(deepEquals(b, a)).toBe(true)

            b.fieldA += '~'

            expect(deepEquals(a, b)).toBe(false)
            expect(deepEquals(b, a)).toBe(false)
        })

        test('A=B & B=A check for instances with nesting', () => {
            const a = new Sample()
            const b = new Sample()

            a.fieldA = new Sample()
            b.fieldA = new Sample()

            expect(deepEquals(a, b)).toBe(true)
            expect(deepEquals(b, a)).toBe(true)

            b.fieldA.fieldA += '~'

            expect(deepEquals(a, b)).toBe(false)
            expect(deepEquals(b, a)).toBe(false)
        })
    })

    describe('shallowEquals', () => {
        test.each`
            type             | a
            ${'booleans'}    | ${false}
            ${'numbers'}     | ${123}
            ${'strings'}     | ${'hello'}
            ${'symbols'}     | ${Symbol(123)}
            ${'undefined'}   | ${undefined}
            ${'null'}        | ${null}
            ${'array'}       | ${[1, 2, 3]}
            ${'pojo'}        | ${{ a: 1, b: 2 }}
            ${'empty array'} | ${[]}
            ${'empty pojo'}  | ${{}}
            ${'date'}        | ${new Date()}
        `('A=A check on $type', ({ a }) => {
            expect(shallowEquals(a, a)).toBe(true)
        })

        test.each`
            a                 | b                 | expected
            ${[]}             | ${[]}             | ${true}
            ${[1, 2, 3]}      | ${[1, 2, 3]}      | ${true}
            ${[1, 2, 3]}      | ${[1, 2, 4]}      | ${false}
            ${[1, 2, 3]}      | ${[1, 2]}         | ${false}
            ${[]}             | ${[1, 2]}         | ${false}
            ${{}}             | ${{}}             | ${true}
            ${{ a: 1, b: 2 }} | ${{ a: 1, b: 2 }} | ${true}
            ${{ a: 1, b: 2 }} | ${{ a: 1 }}       | ${false}
            ${{ a: {} }}      | ${{ a: {} }}      | ${false}
            ${new Date()}     | ${new Date()}     | ${true}
        `('A=B & B=A check: A=$a, B=$b, expected: $expected', ({ a, b, expected }) => {
            expect(shallowEquals(a, b)).toBe(expected)
            expect(shallowEquals(b, a)).toBe(expected)
        })

        test('A=B & B=A check for instances', () => {
            const a = new Sample()
            const b = new Sample()

            expect(shallowEquals(a, b)).toBe(false)
            expect(shallowEquals(b, a)).toBe(false)
        })
    })
})
