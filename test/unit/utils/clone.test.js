import clone, { cloneInstance } from '@/utils/clone'

describe('clone', () => {
    test('Basic objects stay the same', () => {
        const obj = { a: 123, b: 'hello' }
        expect(clone(obj)).toEqual(obj)
    })

    test('Basic nested objects stay the same', () => {
        const obj = { a: 123, b: { c: 'hello-world' } }
        expect(clone(obj)).toEqual(obj)
    })

    test('Simple pojo reference types are re-created', () => {
        const c = { c: 'hello-world' }
        expect(clone({ a: 123, b: c }).b === c).toBe(false)
    })

    test('Retains array structures inside of a pojo', () => {
        const obj = { a: 'abc', d: ['first', 'second'] }
        expect(Array.isArray(clone(obj).d)).toBe(true)
    })

    test('Removes references inside array structures', () => {
        const obj = { a: 'abc', d: ['first', { foo: 'bar' }] }
        expect(clone(obj).d[1] === obj.d[1]).toBe(false)
    })
})

describe('cloneInstance', () => {
    test('creates a copy of a class instance', () => {
        class Sample {
            constructor() {
                this.fieldA = 'fieldA'
                this.fieldB = 'fieldB'
            }

            doSomething () {}
        }

        const sample = new Sample()
        const copy = cloneInstance(sample)

        expect(sample === copy).toBeFalsy()

        expect(copy).toBeInstanceOf(Sample)
        expect(copy.fieldA).toEqual('fieldA')
        expect(copy.fieldB).toEqual('fieldB')
        expect(copy.doSomething).toBeTruthy()
        expect(copy.doSomething).not.toThrow()
    })

    test('creates a broken copy of builtins', () => {
        const sample = new Date()
        const copy = cloneInstance(sample)

        expect(sample === copy).toBeFalsy()
        expect(copy).toBeInstanceOf(Date)
        expect(() => copy.toISOString()).toThrow()
    })
})
