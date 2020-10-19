interface ValidatableData {
    value: any;
}

interface ValidationContext {
    args: any[];
    name: string;
    value: any;
}

interface ValidationError {
    rule?: string;
    context?: any;
    message: string;
}

export { ValidatableData }
export { ValidationContext }
export { ValidationError }

export interface ErrorObserver {
    type: string;
    field: string;
    callback: Function;
}
