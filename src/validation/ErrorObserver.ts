import { has } from '@/utils'

export interface ErrorHandler {
    (errors: Record<string, any> | any[]): void;
}

export interface ErrorObserver {
    callback: ErrorHandler;
    type: 'form' | 'input';
    field?: string;
}

export interface ErrorObserverPredicate {
    (value: ErrorObserver, index: number, array: ErrorObserver[]): unknown;
}

export class ErrorObserverRegistry {
    private observers: ErrorObserver[] = []

    constructor (observers: ErrorObserver[] = []) {
        this.observers = observers
    }

    public add (observer: ErrorObserver): void {
        if (!this.observers.some(o => o.callback === observer.callback)) {
            this.observers.push(observer)
        }
    }

    public remove (handler: ErrorHandler): void {
        this.observers = this.observers.filter(o => o.callback !== handler)
    }

    public filter (predicate: ErrorObserverPredicate): ErrorObserverRegistry {
        return new ErrorObserverRegistry(this.observers.filter(predicate))
    }

    public some (predicate: ErrorObserverPredicate): boolean {
        return this.observers.some(predicate)
    }

    public observe (errors: Record<string, string[]>|string[]): void {
        this.observers.forEach(observer => {
            if (observer.type === 'form') {
                observer.callback(errors)
            } else if (
                observer.field &&
                !Array.isArray(errors) &&
                has(errors, observer.field)
            ) {
                observer.callback(errors[observer.field])
            }
        })
    }
}
