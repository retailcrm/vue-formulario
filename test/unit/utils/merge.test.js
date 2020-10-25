import merge from '@/utils/merge.ts'

describe('merge', () => {
    it('Can merge simple object', () => {
        expect(merge({
            optionA: true,
            optionB: '1234',
        }, {
            optionA: false,
        })).toEqual({
            optionA: false,
            optionB: '1234',
        })
    })

    it('Can add to simple array', () => {
        expect(merge({
            optionA: true,
            optionB: ['first', 'second']
        }, {
            optionB: ['third']
        }, true)).toEqual({
            optionA: true,
            optionB: ['first', 'second', 'third']
        })
    })

    it('Can merge recursively', () => {
        expect(merge({
            optionA: true,
            optionC: {
                first: '123',
                third: {
                    a: 'b',
                },
            },
            optionB: '1234',
        }, {
            optionB: '567',
            optionC: {
                first: '1234',
                second: '789',
            }
        })).toEqual({
            optionA: true,
            optionC: {
                first: '1234',
                third: {
                    a: 'b',
                },
                second: '789',
            },
            optionB: '567',
        })
    })
})
