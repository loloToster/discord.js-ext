import { Cog } from "./Cog"
import { Context } from "./Context"

export type CheckFunc = (ctx: Context, args: string[]) => Promise<boolean> | boolean

export interface CheckData {
    /**
     * The description of the check
     */
    description?: string,
    /**
     * Parameter that determines whether a check should be called before every command
     */
    global?: boolean,
    cog?: Cog
}

export interface RawCheck extends CheckData {
    /**
     * The name of the check
     */
    name?: string,
    /**
     * The function validating the check
     */
    check: CheckFunc
}

/**
 * This class is used to create checks and should only be used internally
 */
export class Check {
    /**
     * The name of the check
     */
    readonly name: string
    /**
     * The function validating the check
     */
    callback: CheckFunc
    /**
     * The description of the check
     */
    description: string
    /**
     * Property that determines whether a check should be called before every command
     */
    global: boolean

    /**
     * The cog that the check is in
     */
    cog: Cog | null

    /**
     * @param name name of the check
     * @param func function validating the check
     * @param data additional check options
     * @example new Check("longMessage", (ctx, args) => ctx.message.content > 50, {})
     */
    constructor(name: string, func: CheckFunc, data: CheckData) {
        this.name = name
        this.callback = func

        this.description = data.description ?? ""
        this.global = data.global ?? false

        this.cog = data.cog ?? null
    }
}
