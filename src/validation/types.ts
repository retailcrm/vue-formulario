interface ValidationContext {
    args: any[]
    name: string
    value: any
}

interface ValidationError {
    rule?: string
    context?: any
    message: string
}

export { ValidationContext }
export { ValidationError }
