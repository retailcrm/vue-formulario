import { get, unset } from '@/utils/access'

class Sample {
    constructor() {
        this.fieldA = 'fieldA'
        this.fieldB = 'fieldB'
    }

    doSomething () {}
}

describe('access', () => {
    describe('get', () => {
        test.each([
            [{ a: { b: { c: 1 } } }, 'a', { b: { c: 1 } }],
            [{ a: { b: { c: 1 } }, d: 1 }, 'a', { b: { c: 1 } }],
            [{ a: { b: { c: 1 } } }, 'a.b.c', 1],
            [{ a: { b: [1] } }, 'a.b[0]', 1],
            [{ a: { b: [1, 2, 3] } }, 'a.b[0]', 1],
            [{ a: { b: [1, 2, 3] } }, 'a.b[1]', 2],
            [{ a: { b: [1, 2, 3] } }, 'a.b[2]', 3],
            [{ a: { b: [1, 2, 3] } }, 'a.b[3]', undefined],
            [{ a: { b: [{ c: 1 }, 2, 3] } }, 'a.b[0].c', 1],
            [{ a: { b: [{ c: 1 }, 2, 3] } }, 'a.b[1].c', undefined],
            [[{ c: 1 }, 2, 3], '[0].c', 1],
            [[{ c: 2 }, 2, 3], '[0].c', 2],
            [new Sample(), 'fieldA', 'fieldA'],
        ])('gets by path', (record, path, expected) => {
            expect(get(record, path)).toEqual(expected)
        })
    })

    describe('unset', () => {
        test.each([
            [{ a: { b: { c: 1 } } }, 'a', {}],
            [{ a: { b: { c: 1 } }, d: 1 }, 'a', { d: 1 }],
            [{ a: { b: { c: 1 } } }, 'a.b.c', { a: { b: {} } }],
            [{ a: { b: [1] } }, 'a.b[0]', { a: { b: [] } }],
            [{ a: { b: [1, 2, 3] } }, 'a.b[0]', { a: { b: [2, 3] } }],
            [{ a: { b: [1, 2, 3] } }, 'a.b[1]', { a: { b: [1, 3] } }],
            [{ a: { b: [1, 2, 3] } }, 'a.b[2]', { a: { b: [1, 2] } }],
            [{ a: { b: [1, 2, 3] } }, 'a.b[3]', { a: { b: [1, 2, 3] } }],
            [{ a: { b: [{ c: 1 }, 2, 3] } }, 'a.b[0].c', { a: { b: [{}, 2, 3] } }],
            [{ a: { b: [{ c: 1 }, 2, 3] } }, 'a.b[1].c', { a: { b: [{ c: 1 }, 2, 3] } }],
            [[{ c: 1 }, 2, 3], '[0].c', [{}, 2, 3]],
        ])('unsets by path', (record, path, expected) => {
            const processed = unset(record, path)

            expect(processed).toEqual(expected)
            expect(processed === record).toBeFalsy()
        })

        test.each`
            type           | scalar
            ${'booleans'}  | ${false}
            ${'numbers'}   | ${123}
            ${'strings'}   | ${'hello'}
            ${'symbols'}   | ${Symbol(123)}
            ${'undefined'} | ${undefined}
            ${'null'}      | ${null}
        `('not unsets for $type', ({ scalar }) => {
            expect(unset(scalar, 'key')).toStrictEqual(scalar)
        })

        test('not unsets for class instance', () => {
            const sample = new Sample()
            const processed = unset(sample, 'fieldA')

            expect(processed.fieldA).toStrictEqual('fieldA')
        })
    })
})
