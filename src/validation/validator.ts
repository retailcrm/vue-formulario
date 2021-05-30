import { has, snakeToCamel } from '@/utils'

export interface Validator {
    (context: ValidationContext): Promise<Violation|null>;
}

export interface Violation {
    message: string;
    rule: string|null;
    args: any[];
    context: ValidationContext|null;
}

export type ViolationsRecord = Record<string, Violation[]>

export interface ValidationRuleFn {
    (context: ValidationContext, ...args: any[]): Promise<boolean>|boolean;
}

export interface ValidationMessageFn {
    (context: ValidationContext, ...args: any[]): string;
}

export interface ValidationMessageI18NFn {
    (vm: Vue, context: ValidationContext, ...args: any[]): string;
}

export interface ValidationContext {
    // The value of the field (do not mutate!),
    value: any;
    // If wrapped in a FormulateForm, the value of other form fields.
    formValues: Record<string, any>;
    // The validation name to be used
    name: string;
}

export type ValidatorGroup = {
    validators: Validator[];
    bail: boolean;
}

export function createValidator (
    ruleFn: ValidationRuleFn,
    ruleName: string|null,
    ruleArgs: any[],
    messageFn: ValidationMessageFn
): Validator {
    return (context: ValidationContext): Promise<Violation|null> => {
        return Promise.resolve(ruleFn(context, ...ruleArgs)).then(valid => {
            return !valid ? {
                rule: ruleName,
                args: ruleArgs,
                context,
                message: messageFn(context, ...ruleArgs),
            } : null
        })
    }
}

export function parseModifier (ruleName: string): [string, string|null] {
    if (/^[\^]/.test(ruleName.charAt(0))) {
        return [snakeToCamel(ruleName.substr(1)), ruleName.charAt(0)]
    }
    return [snakeToCamel(ruleName), null]
}

export function processSingleArrayConstraint (
    constraint: any[],
    rules: Record<string, ValidationRuleFn>,
    messages: Record<string, ValidationMessageFn>
): [Validator, string|null, string|null] {
    const args = constraint.slice()
    const first = args.shift()

    if (typeof first === 'function') {
        return [first, null, null]
    }

    if (typeof first !== 'string') {
        throw new Error('[Formulario]: For array constraint first element must be rule name or Validator function')
    }

    const [name, modifier] = parseModifier(first)

    if (has(rules, name)) {
        return [
            createValidator(
                rules[name],
                name,
                args,
                messages[name] || messages.default
            ),
            name,
            modifier,
        ]
    }

    throw new Error(`[Formulario] Can't create validator for constraint: ${JSON.stringify(constraint)}`)
}

export function processSingleStringConstraint (
    constraint: string,
    rules: Record<string, ValidationRuleFn>,
    messages: Record<string, ValidationMessageFn>
): [Validator, string|null, string|null] {
    const args = constraint.split(':')
    const [name, modifier] = parseModifier(args.shift() || '')

    if (has(rules, name)) {
        return [
            createValidator(
                rules[name],
                name,
                args.length ? args.join(':').split(',') : [],
                messages[name] || messages.default
            ),
            name,
            modifier,
        ]
    }

    throw new Error(`[Formulario] Can't create validator for constraint: ${constraint}`)
}

export function processSingleConstraint (
    constraint: Validator|string|[Validator|string, ...any[]],
    rules: Record<string, ValidationRuleFn>,
    messages: Record<string, ValidationMessageFn>
): [Validator, string|null, string|null] {
    if (typeof constraint === 'function') {
        return [constraint, null, null]
    }

    if (Array.isArray(constraint) && constraint.length) {
        return processSingleArrayConstraint(constraint, rules, messages)
    }

    if (typeof constraint === 'string') {
        return processSingleStringConstraint(constraint, rules, messages)
    }

    return [(): Promise<Violation|null> => Promise.resolve(null), null, null]
}

export function processConstraints (
    constraints: string|any[],
    rules: Record<string, ValidationRuleFn>,
    messages: Record<string, ValidationMessageFn>
): [Validator, string|null, string|null][] {
    if (typeof constraints === 'string') {
        return processConstraints(constraints.split('|').filter(f => f.length), rules, messages)
    }
    if (!Array.isArray(constraints)) {
        return []
    }
    return constraints.map(constraint => processSingleConstraint(constraint, rules, messages))
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
export function createValidatorGroups (rules: [Validator, string|null, string|null][]): ValidatorGroup[] {
    const mapper = ([validator, /** name */, modifier]: [Validator, string|null, string|null]): ValidatorGroup => ({
        validators: [validator],
        bail: modifier === '^',
    })

    const groups: ValidatorGroup[] = []

    const bailIndex = rules.findIndex(([, name]) => name && name.toLowerCase() === 'bail')

    if (bailIndex >= 0) {
        groups.push(...enlarge(rules.splice(0, bailIndex + 1).slice(0, -1).map(mapper)))
        groups.push(...rules.map(([validator]) => ({
            validators: [validator],
            bail: true,
        })))
    } else {
        groups.push(...enlarge(rules.map(mapper)))
    }

    return groups
}

function validateByGroup (group: ValidatorGroup, context: ValidationContext): Promise<Violation[]> {
    return Promise.all(
        group.validators.map(validate => validate(context))
    )
        .then(violations => (violations.filter(v => v !== null) as Violation[]))
}

export function validate (
    validators: [Validator, string|null, string|null][],
    context: ValidationContext
): Promise<Violation[]> {
    return new Promise(resolve => {
        const resolveGroups = (groups: ValidatorGroup[], all: Violation[] = []): void => {
            if (groups.length) {
                const current = groups.shift() as ValidatorGroup

                validateByGroup(current, context).then(violations => {
                    // The rule passed or its a non-bailing group, and there are additional groups to check, continue
                    if ((violations.length === 0 || !current.bail) && groups.length) {
                        return resolveGroups(groups, all.concat(violations))
                    }
                    return resolve(all.concat(violations))
                })
            } else {
                resolve([])
            }
        }
        resolveGroups(createValidatorGroups(validators))
    })
}
