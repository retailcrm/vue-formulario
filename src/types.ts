import Vue from 'vue'
import { Violation } from '@/validation/validator'

export interface FormularioForm extends Vue {
    runValidation(): Promise<Record<string, Violation[]>>;
    resetValidation(): void;
}

export interface FormularioField extends Vue {
    hasModel: boolean;
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

export enum TYPE {
    ARRAY = 'ARRAY',
    BIGINT = 'BIGINT',
    BOOLEAN = 'BOOLEAN',
    DATE = 'DATE',
    FUNCTION = 'FUNCTION',
    NUMBER = 'NUMBER',
    RECORD = 'RECORD',
    STRING = 'STRING',
    SYMBOL = 'SYMBOL',
    UNDEFINED = 'UNDEFINED',
    NULL = 'NULL',
}

export function typeOf (value: unknown): string {
    switch (typeof value) {
        case 'bigint':
            return TYPE.BIGINT
        case 'boolean':
            return TYPE.BOOLEAN
        case 'function':
            return TYPE.FUNCTION
        case 'number':
            return TYPE.NUMBER
        case 'string':
            return TYPE.STRING
        case 'symbol':
            return TYPE.SYMBOL
        case 'undefined':
            return TYPE.UNDEFINED
        case 'object':
            if (value === null) {
                return TYPE.NULL
            }

            if (value instanceof Date) {
                return TYPE.DATE
            }

            if (Array.isArray(value)) {
                return TYPE.ARRAY
            }

            if (value.constructor.name === 'Object') {
                return TYPE.RECORD
            }

            return 'InstanceOf<' + value.constructor.name + '>'
    }

    throw new Error()
}

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
