import type {
    ValidationMessageI18NFn,
    ValidationRuleFn
} from './validation'

export interface Options {
    validationRules?: Record<string, ValidationRuleFn>;
    validationMessages?: Record<string, ValidationMessageI18NFn|string>;
}
