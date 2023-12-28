import type { Violation } from './validation'

export type Empty = undefined | null

export type Context<T> = {
    model: T;
    name: string;
    path: string;
    violations: Violation[];
    errors: string[];
    allErrors: string[];
    runValidation(): Promise<Violation[]>;
}

export interface ModelGetConverter {
    <U, T>(value: U|Empty): U|T|Empty;
}

export interface ModelSetConverter {
    <T, U>(curr: U|T, prev: U|Empty): U|T;
}

/**
 * - 'demand': triggers validation on manual call
 * - 'live': triggers validation on any changes
 * - 'submit': triggers validation on form submit event
 */
export type ValidationBehaviour = 'demand' | 'live' | 'submit'

/**
 *  - 'none': no any specific effects
 *  - 'unset': the value under field's path will be unset and path will be removed from the state
 */
export type UnregisterBehaviour = 'none' | 'unset'
