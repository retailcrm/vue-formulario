/**
 * Shorthand for Object.prototype.hasOwnProperty.call (space saving)
 */
export default function has (ctx: Record<string, any>|any[], prop: string|number): boolean {
    return Object.prototype.hasOwnProperty.call(ctx, prop)
}
