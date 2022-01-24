import { Cog } from "./Cog";
import { Context } from "./Context";

export type CommandFunc = (ctx: Context, args: string[]) => any

export interface CommandData {
    /**
     * The list of aliases the command can be invoked under
     */
    aliases?: string[],
    /**
     * The desription of the command
     */
    description?: string,
    /**
     * Names of the checks that should be called when processing this command
     */
    check?: string[],
    cog?: Cog
}

export interface RawCommand extends CommandData {
    /**
     * The name of the command (defaults to the key of the cog)
     */
    name?: string,
    /**
     * The function executed upon command's invoke
     */
    command: CommandFunc
}

/**
 * This class is used to create commands and should only be used internally
 */
export class Command {
    readonly name: string
    callback: CommandFunc

    aliases: string[]
    description: string
    check: string[]

    cog: Cog | null

    /**
     * @param name name of the command
     * @param func the function executed upon command's invoke
     * @param data additional command options
     * @example new Command("ping", async (ctx, args) => await ctx.send(bot.ws.ping + "ms"), {})
     */
    constructor(name: string, func: CommandFunc, data: CommandData) {
        this.name = name
        this.callback = func

        this.aliases = data.aliases ?? []
        this.description = data.description ?? ""
        this.check = data.check ?? []

        this.cog = data.cog ?? null
    }
}
