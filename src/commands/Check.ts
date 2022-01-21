import { Cog } from "./Cog"
import { Context } from "./Context"

export type CheckFunc = (ctx: Context, args: string[]) => Promise<boolean> | boolean

export interface CheckData {
    description?: string,
    global?: boolean,
    cog?: Cog
}

export interface RawCheck extends CheckData {
    name?: string,
    check: CheckFunc
}

export class Check {
    name: string
    callback: CheckFunc

    description: string
    global: boolean

    cog: Cog | null

    constructor(name: string, func: CheckFunc, data: CheckData) {
        this.name = name
        this.callback = func

        this.description = data.description ?? ""
        this.global = data.global ?? false

        this.cog = data.cog ?? null
    }
}
