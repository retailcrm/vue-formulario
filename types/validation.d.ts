import { Vue } from 'vue/types/vue'

export interface ValidationContext {
    // The value of the field (do not mutate!),
    value: any;
    // If wrapped in a FormulateForm, the value of other form fields.
    formValues: Record<string, any>;
    // The validation name to be used
    name: string;
}

export interface Violation {
    message: string;
    rule: string|null;
    args: any[];
    context: ValidationContext|null;
}

export interface Validator {
    (context: ValidationContext): Promise<Violation|null>;
}

export type ValidatorGroup = {
    validators: Validator[];
    bail: boolean;
}

export interface ValidationRuleFn {
    (context: ValidationContext, ...args: any[]): Promise<boolean>|boolean;
}

export interface ValidationMessageFn {
    (context: ValidationContext, ...args: any[]): string;
}

export interface ValidationMessageI18NFn {
    (vm: Vue, context: ValidationContext, ...args: any[]): string;
}
