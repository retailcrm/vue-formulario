import {
    ValidatableData,
    ValidationRule,
} from '@/validation/types'

export type Validator = {
    name?: string;
    rule: ValidationRule;
    args: any[];
}

export type ValidatorGroup = {
    validators: Validator[];
    bail: boolean;
}

export function enlarge (groups: ValidatorGroup[]): ValidatorGroup[] {
    const enlarged: ValidatorGroup[] = []

    if (groups.length) {
        let current: ValidatorGroup = groups.shift() as ValidatorGroup
        enlarged.push(current)
        groups.forEach((group) => {
            if (!group.bail && group.bail === current.bail) {
                current.validators.push(...group.validators)
            } else {
                current = { ...group }
                enlarged.push(current)
            }
        })
    }

    return enlarged
}

/**
 * Given an array of rules, group them by bail signals. For example for this:
 * bail|required|min:10|max:20
 * we would expect:
 * [[required], [min], [max]]
 * because any sub-array failure would cause a shutdown. While
 * ^required|min:10|max:10
 * would return:
 * [[required], [min, max]]
 * and no bailing would produce:
 * [[required, min, max]]
 * @param {array} rules
 */
export function createValidatorGroups (rules: [ValidationRule, any[], string, string|null][]): ValidatorGroup[] {
    const mapper = ([
        rule,
        args,
        name,
        modifier
    ]: [ValidationRule, any[], string, any]): ValidatorGroup => ({
        validators: [{ name, rule, args }],
        bail: modifier === '^',
    })

    const groups: ValidatorGroup[] = []

    const bailIndex = rules.findIndex(([,, rule]) => rule.toLowerCase() === 'bail')

    if (bailIndex >= 0) {
        groups.push(...enlarge(rules.splice(0, bailIndex + 1).slice(0, -1).map(mapper)))
        groups.push(...rules.map(([rule, args, name]) => ({
            validators: [{ rule, args, name }],
            bail: true,
        })))
    } else {
        groups.push(...enlarge(rules.map(mapper)))
    }

    return groups
}

export function validate (validator: Validator, data: ValidatableData): Promise<boolean> {
    return Promise.resolve(validator.rule(data, ...validator.args))
}
