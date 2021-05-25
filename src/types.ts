import { Violation } from '@/validation/validator'

export interface FormularioFieldInterface {
    hasModel: boolean;
    model: unknown;
    proxy: unknown;
    setErrors(errors: string[]): void;
    runValidation(): Promise<Violation[]>;
    resetValidation(): void;
}
