import { Violation } from '@/validation/validator'

export interface FormularioFieldInterface {
    hasModel: boolean;
    model: unknown;
    proxy: unknown;
    setErrors(errors: string[]): void;
    runValidation(): Promise<Violation[]>;
    resetValidation(): void;
}

export type FormularioFieldContext<T> = {
    model: T;
    name: string;
    runValidation(): Promise<Violation[]>;
    violations: Violation[];
    errors: string[];
    allErrors: string[];
}

export interface FormularioFieldModelGetConverter {
    <U, T>(value: U|Empty): U|T|Empty;
}

export interface FormularioFieldModelSetConverter {
    <T, U>(curr: U|T, prev: U|Empty): U|T;
}

export type Empty = undefined | null

export type RecordKey = string | number
export type RecordLike<T> = T[] | Record<RecordKey, T>

export type Scalar = boolean | number | string | symbol | Empty

export function isRecordLike (value: unknown): boolean {
    return typeof value === 'object' && value !== null && ['Array', 'Object'].includes(value.constructor.name)
}

export function isScalar (value: unknown): boolean {
    switch (typeof value) {
        case 'bigint':
        case 'boolean':
        case 'number':
        case 'string':
        case 'symbol':
        case 'undefined':
            return true
        default:
            return value === null
    }
}
