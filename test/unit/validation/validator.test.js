import { enlarge } from '@/validation/validator.ts'

// @TODO: Converting raw rule data to validator

describe('Validator', () => {
    it ('Enlarges validator groups', () => {
        expect(enlarge([{
            validators: [],
            bail: false,
        }, {
            validators: [],
            bail: false,
        }, {
            validators: [],
            bail: false,
        }, {
            validators: [],
            bail: true,
        }, {
            validators: [],
            bail: false,
        }, {
            validators: [],
            bail: false,
        }])).toEqual([{
            validators: [],
            bail: false,
        }, {
            validators: [],
            bail: true,
        }, {
            validators: [],
            bail: false,
        }])
    })
})
