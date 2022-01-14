import { Client, ClientEvents, ClientOptions, Message } from "discord.js";
import { Context } from "./Context";

type PrefixFunc = (bot: Bot, msg: Message) => string | Promise<string>
type Prefix = string[] | PrefixFunc

export interface BotOptions extends ClientOptions {
    prefix: string | Prefix
}

type CommandFunc = (ctx: Context, args: string[]) => any

export interface Command {
    name: string,
    aliases?: string[],
    description?: string,
    execute: CommandFunc
}

export interface BotEvents extends ClientEvents {
    commandError: [cmd: Command, err: unknown],
    commandNotFound: [msg: Message, cmdName: string, args: string[]]
}

export interface Bot {
    on<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this,
    emit<K extends keyof BotEvents>(event: K, ...args: BotEvents[K]): boolean
}

export class Bot extends Client {

    prefix: Prefix
    private _commands: Required<Command>[]

    constructor(options: BotOptions) {
        super(options)

        if (typeof options.prefix === "string")
            this.prefix = [options.prefix]
        else
            this.prefix = options.prefix

        this._commands = []

        this.on("messageCreate", this._commandHandler)
    }

    private async _commandHandler(msg: Message) {
        const prefixes = typeof this.prefix === "function" ?
            [await this.prefix(this, msg)] : this.prefix

        let content = msg.content

        for (const prefix of prefixes) {
            if (!content.startsWith(prefix)) continue
            content = content.substring(prefix.length)
            let args = content.split(/ +/g)
            let command = args.shift() ?? ""

            let found = await this.executeCommand(msg, command, args)
            if (!found) this.emit("commandNotFound", msg, command, args)
        }
    }

    addCommand(name: string, func: CommandFunc, commandData: Omit<Command, "name" | "execute"> = {}) {
        this._commands.push({
            name,
            aliases: commandData.aliases ?? [],
            description: commandData.description ?? "",
            execute: func
        })
    }

    getCommand(name: string) {
        return this._commands.find(
            cmd => cmd.name === name || cmd.aliases.some(a => a === name)
        )
    }

    async executeCommand(msg: Message, cmdName: string, args: string[]) {
        if (!cmdName) return false
        const cmd = this.getCommand(cmdName)
        if (!cmd) return false

        try {
            await cmd.execute(
                new Context({
                    args,
                    bot: this,
                    command: cmd,
                    message: msg,
                    invokedWith: cmdName
                }), args
            )
        } catch (err) {
            this.emit("commandError", cmd, err)
        }

        return true
    }

    get commands() {
        return this._commands
    }
}
