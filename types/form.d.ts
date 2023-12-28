import type { DefineComponent } from './vue'
import type { Violation } from './validation'

export type FormularioFormConstructor = DefineComponent<{
    id?: string;
    state?: Record<string, unknown>;
    fieldsErrors?: Record<string, string[]>;
    formErrors?: string[];
}, {
    setErrors ({ formErrors, fieldsErrors }: {
        formErrors?: string[];
        fieldsErrors?: Record<string, string[]>;
    }): void;
    runValidation(): Promise<Record<string, Violation[]>>;
    hasValidationErrors (): Promise<boolean>;
    resetValidation(): void;
}>
