import clone from '@/utils/clone'

describe('clone', () => {
    it('Basic objects stay the same', () => {
        const obj = { a: 123, b: 'hello' }
        expect(clone(obj)).toEqual(obj)
    })

    it('Basic nested objects stay the same', () => {
        const obj = { a: 123, b: { c: 'hello-world' } }
        expect(clone(obj)).toEqual(obj)
    })

    it('Simple pojo reference types are re-created', () => {
        const c = { c: 'hello-world' }
        expect(clone({ a: 123, b: c }).b === c).toBe(false)
    })

    it('Retains array structures inside of a pojo', () => {
        const obj = { a: 'abcd', d: ['first', 'second'] }
        expect(Array.isArray(clone(obj).d)).toBe(true)
    })

    it('Removes references inside array structures', () => {
        const obj = { a: 'abcd', d: ['first', { foo: 'bar' }] }
        expect(clone(obj).d[1] === obj.d[1]).toBe(false)
    })
})
