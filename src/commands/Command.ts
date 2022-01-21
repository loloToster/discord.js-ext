import { Cog } from "./Cog";
import { Context } from "./Context";

export type CommandFunc = (ctx: Context, args: string[]) => any

export interface CommandData {
    aliases?: string[],
    description?: string,
    check?: string[],
    cog?: Cog
}

export interface RawCommand extends CommandData {
    name?: string,
    command: CommandFunc
}

export class Command {
    name: string
    callback: CommandFunc

    aliases: string[]
    description: string
    check: string[]

    cog: Cog | null

    constructor(name: string, func: CommandFunc, data: CommandData) {
        this.name = name
        this.callback = func

        this.aliases = data.aliases ?? []
        this.description = data.description ?? ""
        this.check = data.check ?? []

        this.cog = data.cog ?? null
    }
}
