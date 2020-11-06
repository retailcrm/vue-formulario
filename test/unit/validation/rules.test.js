import rules from '@/validation/rules.ts'

const today = new Date()
const tomorrow = new Date()
const yesterday = new Date()

tomorrow.setDate(today.getDate() + 1)
yesterday.setDate(today.getDate() - 1)

describe('accepted', () => {
    const validate = value => rules.accepted({ value, name: '', formValues: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    it('passes with true', () => expectPass('yes'))
    it('passes with on', () => expectPass('on'))
    it('passes with 1', () => expectPass('1'))
    it('passes with number 1', () => expectPass(1))
    it('passes with boolean true', () => expectPass(true))
    it('fail with boolean false', () => expectFail(false))
    it('fail with "false"', () => expectFail('false'))
})

describe('after', () => {
    const validate = (value, compare = false) => rules.after({ value, name: '', formValues: {} }, compare)
    const expectPass = (value, compare = false) => expect(validate(value, compare)).toBe(true)
    const expectFail = (value, compare = false) => expect(validate(value, compare)).toBe(false)

    it('passes with tomorrow’s date object', () => expectPass(tomorrow))
    it('passes with future date', () => expectPass('January 15, 2999'))
    it('passes with long past date', () => expectPass(yesterday, 'Jan 15, 2000'))
    it('fails with yesterday’s date', () => expectFail(yesterday))
    it('fails with old date string', () => expectFail('January, 2000'))
    it('fails with invalid value', () => expectFail(''))
})

describe('alpha', () => {
    const validate = (value, set = 'default') => rules.alpha({ value, name: '', formValues: {} }, set)

    it('passes with simple string', () => {
        expect(validate('abc')).toBe(true)
    })

    it('passes with long string', () => {
        expect(validate('lkashdflaosuihdfaisudgflakjsdbflasidufg')).toBe(true)
    })

    it('passes with single character', () => {
        expect(validate('z')).toBe(true)
    })

    it('passes with accented character', () => {
        expect(validate('jüstin')).toBe(true)
    })

    it('passes with lots of accented characters', () => {
        expect(validate('àáâäïíôöÆ')).toBe(true)
    })

    it('passes with lots of accented characters if invalid set', () => {
        expect(validate('àáâäïíôöÆ', 'russian')).toBe(true)
    })

    it('fails with lots of accented characters if latin', () => {
        expect(validate('àáâäïíôöÆ', 'latin')).toBe(false)
    })

    it('fails with numbers', () => {
        expect(validate('justin83')).toBe(false)
    })

    it('fails with symbols', () => {
        expect(validate('-justin')).toBe(false)
    })
})

describe('alphanumeric', () => {
    const validate = (value, set = 'default') => rules.alphanumeric({ value, name: '', formValues: {} }, set)

    it('passes with simple string', () => {
        expect(validate('567abc')).toBe(true)
    })

    it('passes with long string', () => {
        expect(validate('lkashdfla234osuihdfaisudgflakjsdbfla567sidufg')).toBe(true)
    })

    it('passes with single character', () => {
        expect(validate('z')).toBe(true)
    })

    it('passes with accented character', () => {
        expect(validate('jüst56in')).toBe(true)
    })

    it('passes with lots of accented characters', () => {
        expect(validate('àáâ7567567äïíôöÆ')).toBe(true)
    })

    it('passes with lots of accented characters if invalid set', () => {
        expect(validate('123123àáâäï67íôöÆ', 'russian')).toBe(true)
    })

    it('fails with lots of accented characters if latin', () => {
        expect(validate('àáâäï123123íôöÆ', 'latin')).toBe(false)
    })

    it('fails with decimals in', () => {
        expect(validate('abcABC99.123')).toBe(false)
    })
})

describe('before', () => {
    const validate = (value, compare = false) => rules.before({ value, name: '', formValues: {} }, compare)
    const expectPass = (value, compare = false) => expect(validate(value, compare)).toBe(true)
    const expectFail = (value, compare = false) => expect(validate(value, compare)).toBe(false)

    it('fails with tomorrow’s date object', () => expectFail(tomorrow))
    it('fails with future date', () => expectFail('January 15, 2999'))
    it('fails with long past date', () => expectFail(yesterday, 'Jan 15, 2000'))
    it('passes with yesterday’s date', () => expectPass(yesterday))
    it('passes with old date string', () => expectPass('January, 2000'))
    it('fails with invalid value', () => expectFail(''))
})

describe('between', () => {
    const validate = (value, from, to, force = undefined) => {
        return rules.between({value, name: '', formValues: {}}, from, to, force)
    }

    const expectPass = (value, from, to, force = undefined) => expect(validate(value, from, to, force)).toBe(true)
    const expectFail = (value, from, to, force = undefined) => expect(validate(value, from, to, force)).toBe(false)

    it('passes with simple number', () => expectPass(5, 0, 10))
    it('passes with simple number string', () => expectPass('5', '0', '10'))
    it('passes with decimal number string', () => expectPass('0.5', '0', '1'))
    it('passes with string length', () => expectPass('abc', 2, 4))
    it('fails with string length too long', () => expectFail('abcdef', 2, 4))
    it('fails with string length too short', () => expectFail('abc', 3, 10))
    it('fails with number too small', () => expectFail(0, 3, 10))
    it('fails with number too large', () => expectFail(15, 3, 10))
    it('passes when forced to value', () => expectPass('4', 3, 10, 'value'))
    it('fails when forced to value', () => expectFail(442, 3, 10, 'value'))
    it('passes when forced to length', () => expectPass(7442, 3, 10, 'length'))
    it('fails when forced to length', () => expectFail(6, 3, 10, 'length'))
})

describe('confirm', () => {
    const validate = (context, field = undefined) => rules.confirm(context, field)
    const expectPass = (context, field = undefined) => expect(validate(context, field)).toBe(true)
    const expectFail = (context, field = undefined) => expect(validate(context, field)).toBe(false)

    it('Passes when the values are the same strings', () => expectPass({
        value: 'abc',
        name: 'password',
        formValues: { password_confirm: 'abc' }
    }))

    it('Passes when the values are the same integers', () => expectPass({
        value: 4422132,
        name: 'xyz',
        formValues: { xyz_confirm: 4422132 }
    }))

    it('Passes when using a custom field', () => expectPass({
        value: 4422132,
        name: 'name',
        formValues: { other_field: 4422132 }
    }, 'other_field'))

    it('Passes when using a field ends in _confirm', () => expectPass({
        value: '$ecret',
        name: 'password_confirm',
        formValues: { password: '$ecret' }
    }))

    it('Fails when using different strings', () => expectFail({
        value: 'Justin',
        name: 'name',
        formValues: { name_confirm: 'Daniel' }
    }))

    it('Fails when the types are different', () => expectFail({
        value: '1234',
        name: 'num',
        formValues: { num_confirm: 1234 }
    }))
})

describe('date', () => {
    const validate = (value, format = false) => rules.date({ value, name: '', formValues: {} }, format)
    const expectPass = (value, compare = false) => expect(validate(value, compare)).toBe(true)
    const expectFail = (value, compare = false) => expect(validate(value, compare)).toBe(false)

    it('passes with month day year', () => expectPass('December 17, 2020'))
    it('passes with month day', () => expectPass('December 17'))
    it('passes with short month day', () => expectPass('Dec 17'))
    it('passes with short month day and time', () => expectPass('Dec 17 12:34:15'))
    it('passes with out of bounds number', () => expectPass('January 77'))
    it('fails with only month', () => expectFail('January'))
    it('passes with valid date format', () => expectPass('12/17/1987', 'MM/DD/YYYY'))
    it('fails with simple number and date format', () => expectFail('1234', 'MM/DD/YYYY'))
    it('fails with only day of week', () => expectFail('saturday'))
    it('fails with random string', () => expectFail('Pepsi 17'))
    it('fails with random number', () => expectFail('1872301237'))
})

/**
 * Note: testing is light, regular expression used is here: http://jsfiddle.net/ghvj4gy9/embedded/result,js/
 */
describe('email', () => {
    const validate = value => rules.email({ value, name: '', formValues: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    it('passes normal email', () => expectPass('dev+123@wearebraid.com'))
    it('passes numeric email', () => expectPass('12345@google.com'))
    it('passes unicode email', () => expectPass('àlphä@❤️.ly'))
    it('passes numeric with new tld', () => expectPass('12345@google.photography'))
    it('fails string without tld', () => expectFail('12345@localhost'))
    it('fails string without invalid name', () => expectFail('1*(123)2345@localhost'))
})

describe('endsWith', () => {
    const validate = (value, ...stack) => rules.endsWith({ value, name: '', formValues: {} }, ...stack)
    const expectPass = (value, ...stack) => expect(validate(value, ...stack)).toBe(true)
    const expectFail = (value, ...stack) => expect(validate(value, ...stack)).toBe(false)

    it('fails when value ending is not in stack of single value', () => expectFail(
        'andrew@wearebraid.com',
        '@gmail.com'
    ))

    it('fails when value ending is not in stack of multiple values', () => expectFail(
        'andrew@wearebraid.com',
        '@gmail.com', '@yahoo.com'
    ))

    it('fails when passed value is not a string', () => expectFail(
        'andrew@wearebraid.com',
        ['@gmail.com', '@wearebraid.com']
    ))

    it('fails when passed value is not a string', () => expectFail(
        'andrew@wearebraid.com',
        { value: '@wearebraid.com' }
    ))

    it('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
        expectPass('andrew@wearebraid.com', { value: 'bad data' }, ['no bueno'], '@wearebraid.com')
    })

    it('passes when stack consists of zero values', () => expectPass('andrew@wearebraid.com'))

    it('passes when value ending is in stack of single value', () => expectPass(
        'andrew@wearebraid.com',
        '@wearebraid.com'
    ))

    it('passes when value ending is in stack of multiple values', () => expectPass(
        'andrew@wearebraid.com',
        '@yahoo.com', '@wearebraid.com', '@gmail.com'
    ))
})

describe('in', () => {
    const validate = (value, ...stack) => rules.in({ value, name: '', formValues: {} }, ...stack)
    const expectPass = (value, ...stack) => expect(validate(value, ...stack)).toBe(true)
    const expectFail = (value, ...stack) => expect(validate(value, ...stack)).toBe(false)

    it('fails when not in stack', () => expectFail('third', 'first', 'second'))
    it('fails when case sensitive mismatch is in stack', () => expectFail(
        'third',
        'first', 'second', 'Third'
    ))
    it('fails comparing dissimilar objects', () => expectFail(
        { f: 'abc' },
        { a: 'cdf' }, { b: 'abc' }
    ))
    it('passes when case sensitive match is in stack', () => expectPass(
        'third',
        'first', 'second', 'third'
    ))
    it('passes a shallow array compare', () => expectPass(['abc'], ['cdf'], ['abc']))
    it('passes a shallow object compare', () => expectPass(
        { f: 'abc' },
        { a: 'cdf' }, { f: 'abc' }
    ))
})

describe('matches', () => {
    const validate = (value, ...stack) => rules.matches({ value, name: '', formValues: {} }, ...stack)
    const expectPass = (value, ...stack) => expect(validate(value, ...stack)).toBe(true)
    const expectFail = (value, ...stack) => expect(validate(value, ...stack)).toBe(false)

    it('simple strings fail if they aren’t equal', () => expectFail('third', 'first'))
    it('fails on non matching regex', () => expectFail('third', /^thirds/))
    it('passes if simple strings match', () => expectPass('second', 'third', 'second'))
    it('passes on matching regex', () => expectPass('third', /^third/))
    it('passes on matching mixed regex and string', () => expectPass(
        'first-fourth',
        'second', /^third/, /fourth$/
    ))
    it('fails on a regular expression encoded as a string', () => expectFail('mypassword', '/[0-9]/'))
    it('passes on a regular expression encoded as a string', () => expectPass('mypa55word', '/[0-9]/'))
    it('passes on a regular expression containing slashes', () => expectPass(
        'https://',
        '/https?:///'
    ))
})

describe('max', () => {
    const validate = (value, max, force = undefined) => rules.max({value, name: '', formValues: {}}, max, force)
    const expectPass = (v, max, force = undefined) => expect(validate(v, max, force)).toBe(true)
    const expectFail = (v, max, force = undefined) => expect(validate(v, max, force)).toBe(false)

    it('passes when a number string', () => expectPass('5', '5'))
    it('passes when a number', () => expectPass(5, 6))
    it('passes when a string length', () => expectPass('foobar', '6'))
    it('passes when a array length', () => expectPass(Array(6), '6'))
    it('passes when forced to validate on length', () => expectPass(10, 3, 'length'))
    it('passes when forced to validate string on value', () => expectPass('b', 'e', 'value'))
    it('fails when a array length', () => expectFail(Array(6), '5'))
    it('fails when a string length', () => expectFail('bar', 2))
    it('fails when a number', () => expectFail(10, '7'))
    it('fails when forced to validate on length', () => expectFail(-10, '1', 'length'))
})

describe('min', () => {
    const validate = (value, min, force = undefined) => rules.min({value, name: '', formValues: {}}, min, force)
    const expectPass = (v, min, force = undefined) => expect(validate(v, min, force)).toBe(true)
    const expectFail = (v, min, force = undefined) => expect(validate(v, min, force)).toBe(false)

    it('passes when a number string', () => expectPass('5', '5'))
    it('passes when a number', () => expectPass(6, 5))
    it('passes when a string length', () => expectPass('foobar', '6'))
    it('passes when a array length', () => expectPass(Array(6), '6'))
    it('passes when string is forced to value', () => expectPass('bcd', 'aaa', 'value'))
    it('fails when string is forced to lesser value', () => expectFail('a', 'b', 'value'))
    it('passes when a number is forced to length', () => expectPass('000', 3, 'length'))
    it('fails when a number is forced to length', () => expectFail('44', 3, 'length'))
    it('fails when a array length', () => expectFail(Array(6), '7'))
    it('fails when a string length', () => expectFail('bar', 4))
    it('fails when a number', () => expectFail(3, '7'))
})

describe('not', () => {
    const validate = (value, ...stack) => rules.not({ value, name: '', formValues: {} }, ...stack)
    const expectPass = (value, ...stack) => expect(validate(value, ...stack)).toBe(true)
    const expectFail = (value, ...stack) => expect(validate(value, ...stack)).toBe(false)

    it('passes when a number string', () => expectPass('5', '6'))
    it('passes when a number', () => expectPass(1, 30))
    it('passes when a string', () => expectPass('abc', 'def'))
    it('fails when a shallow equal array', () => expectFail(['abc'], ['abc']))
    it('fails when a shallow equal object', () => expectFail({a: 'abc'}, ['123'], {a: 'abc'}))
    it('fails when string is in stack', () => expectFail('a', 'b', 'c', 'd', 'a', 'f'))
})

describe('number', () => {
    const validate = value => rules.number({ value, name: '', formValues: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    it('passes with simple number string', () => expectPass('123'))
    it('passes with simple number', () => expectPass(19832461234))
    it('passes with float', () => expectPass(198.32464))
    it('passes with decimal in string', () => expectPass('567.23'))
    it('fails with comma in number string', () => expectFail('123,456'))
    it('fails with alpha', () => expectFail('123sdf'))
})

describe('required', () => {
    const validate = (value, isRequired = true) => rules.required({ value, name: '', formValues: {} }, isRequired)
    const expectPass = (value, isRequired = true) => expect(validate(value, isRequired)).toBe(true)
    const expectFail = (value, isRequired = true) => expect(validate(value, isRequired)).toBe(false)

    it('fails on empty string', () => expectFail(''))
    it('fails on empty array', () => expectFail([]))
    it('fails on empty object', () => expectFail({}))
    it('fails on null', () => expectFail(null))
    it('passes with the number zero', () => expectPass(0))
    it('passes with the boolean false', () => expectPass(false))
    it('passes with a non empty array', () => expectPass(['123']))
    it('passes with a non empty object', () => expectPass({ a: 'b' }))
    it('passes with empty value if second argument is false', () => expectPass('', false))
    it('passes with empty value if second argument is false string', () => {
        expectPass('', 'false')
    })
})

describe('startsWith', () => {
    const validate = (value, ...args) => rules.startsWith({ value, name: '', formValues: {} }, ...args)

    it('fails when value starting is not in stack of single value', () => {
        expect(validate('taco tuesday', 'pizza')).toBe(false)
    })

    it('fails when value starting is not in stack of multiple values', () => {
        expect(validate('taco tuesday', 'pizza', 'coffee')).toBe(false)
    })

    it('fails when passed value is not a string', () => {
        expect(validate('taco tuesday', ['taco', 'pizza'])).toBe(false)
    })

    it('fails when passed value is not a string', () => {
        expect(validate('taco tuesday', {value: 'taco'})).toBe(false)
    })

    it('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
        expect(validate('taco tuesday', {value: 'taco'}, ['taco'], 'taco')).toBe(true)
    })

    it('passes when stack consists of zero values', () => {
        expect(validate('taco tuesday')).toBe(true)
    })

    it('passes when value starting is in stack of single value', () => {
        expect(validate('taco tuesday', 'taco')).toBe(true)
    })

    it('passes when value starting is in stack of multiple values', () => {
        expect(validate('taco tuesday', 'pizza', 'taco', 'coffee')).toBe(true)
    })
})

/**
 * Url rule.
 *
 * Note: these are just sanity checks because the actual package we use is
 * well tested: https://github.com/segmentio/is-url/blob/master/test/index.js
 */
describe('url', () => {
    const validate = value => rules.url({ value, name: '', formValues: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    it('passes with http://google.com', () => expectPass('http://google.com'))
    it('passes with http://scholar.google.com', () => expectPass('http://scholar.google.com'))
    it('fails with google.com', () => expectFail('google.com'))
})
