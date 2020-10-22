export interface ValidatableData {
    // The value of the field (do not mutate!),
    value: any;
    // If wrapped in a FormulateForm, the value of other form fields.
    getFormValues(): Record<string, any>;
    // The validation name to be used
    name: string;
}

export interface ValidationContext {
    // The value of the field (do not mutate!),
    value: any;
    // If wrapped in a FormulateForm, the value of other form fields.
    formValues: Record<string, any>;
    // The validation name to be used
    name: string;
    // Array of rule arguments: between:5,10 (args are ['5', '10'])
    args: any[];
}

export interface ValidationRule {
    (context: ValidatableData, ...args: any[]): Promise<boolean>;
}

export interface ValidationError {
    rule?: string;
    context?: ValidationContext;
    message: string;
}

export interface ValidationErrorBag {
    name: string;
    errors: ValidationError[];
}
