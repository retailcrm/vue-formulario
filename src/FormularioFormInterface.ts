export default interface FormularioFormInterface {
    name: string | boolean;
    $options: Record<string, any>;
    setValues(values: Record<string, any>): void;
    loadErrors ({ formErrors, inputErrors }: { formErrors: string[]; inputErrors: Record<string, string[]> }): void;
    resetValidation (): void;
}
