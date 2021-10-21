import clone from '@/utils/clone'

class Sample {
    constructor() {
        this.fieldA = 'fieldA'
        this.fieldB = 'fieldB'
    }

    doSomething () {}
}

describe('clone', () => {
    test.each([
        [{ a: 123, b: 'hello' }],
        [{ a: 123, b: { c: 'hello-world' } }],
        [{
            id: 123,
            addresses: [{
                street: 'Baker Street',
                building: '221b',
            }],
        }],
    ])('recreates object, preserving its structure', state => {
        expect(clone(state)).toEqual(state)
        expect(clone({ ref: state }).ref === state).toBe(false)
    })

    test('retains array structures inside of a pojo', () => {
        const obj = { a: 'abc', d: ['first', 'second'] }
        expect(Array.isArray(clone(obj).d)).toBe(true)
    })

    test('removes references inside array structures', () => {
        const obj = { a: 'abc', d: ['first', { foo: 'bar' }] }
        expect(clone(obj).d[1] === obj.d[1]).toBe(false)
    })

    test('creates a copy of a date', () => {
        const date = new Date()
        const copy = clone(date)

        expect(date === copy).toBeFalsy()
        expect(copy.toISOString()).toStrictEqual(date.toISOString())
    })

    test('creates a copy of a nested date', () => {
        const date = new Date()
        const copy = clone({ date })

        expect(date === copy.date).toBeFalsy()
        expect(copy.date.toISOString()).toStrictEqual(date.toISOString())
    })

    test('creates a copy of a class instance', () => {
        const sample = new Sample()
        const copy = clone(sample)

        expect(sample === copy).toBeFalsy()

        expect(copy).toBeInstanceOf(Sample)
        expect(copy.fieldA).toEqual('fieldA')
        expect(copy.fieldB).toEqual('fieldB')
        expect(copy.doSomething).toBeTruthy()
        expect(copy.doSomething).not.toThrow()
    })

    test('creates a copy of a nested class instance', () => {
        const sample = new Sample()
        const copy = clone({ sample })

        expect(sample === copy.sample).toBeFalsy()

        expect(copy.sample).toBeInstanceOf(Sample)
        expect(copy.sample.fieldA).toEqual('fieldA')
        expect(copy.sample.fieldB).toEqual('fieldB')
        expect(copy.sample.doSomething).toBeTruthy()
        expect(copy.sample.doSomething).not.toThrow()
    })

    test('does not create a copy of a blob', () => {
        const blob = new Blob(['{"fieldA": "fieldA"}'], { type : 'application/json' })
        const copy = clone(blob)

        expect(blob === copy).toBeTruthy()
    })
})
