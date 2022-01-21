import { Client, ClientEvents, ClientOptions, Message } from "discord.js";
import { Context } from "./Context";

type PrefixFunc = (bot: Bot, msg: Message) => string | Promise<string>
type Prefix = string[] | PrefixFunc

export interface BotOptions extends ClientOptions {
    prefix: string | Prefix
}

type CheckFunc = (ctx: Context, args: string[]) => Promise<boolean> | boolean

export interface CheckData {
    description?: string,
    global?: boolean,
}

export interface Check extends CheckData {
    name: string,
    check: CheckFunc
}

type CommandFunc = (ctx: Context, args: string[]) => any

export interface CommandData {
    aliases?: string[],
    description?: string,
    check?: string[],
}

export interface Command extends CommandData {
    name: string,
    execute: CommandFunc
}

export interface BotEvents extends ClientEvents {
    checkError: [ctx: Context, err: unknown],
    commandError: [ctx: Context, err: unknown],
    commandNotFound: [msg: Message, cmdName: string, args: string[]]
}

export interface Bot {
    on<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this,
    emit<K extends keyof BotEvents>(event: K, ...args: BotEvents[K]): boolean
}

export class Bot extends Client {

    prefix: Prefix
    private _commands: Required<Command>[]
    private _checks: Required<Check>[]
    private _globalChecks: Required<Check>[]

    constructor(options: BotOptions) {
        super(options)

        this.prefix = typeof options.prefix === "string" ?
            this.prefix = [options.prefix] :
            this.prefix = options.prefix

        this._commands = []
        this._checks = []
        this._globalChecks = []

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

    private async _check(ctx: Context, args: string[]) {

        const toCheck = this._globalChecks.concat(
            this._checks.filter(c => ctx.command.check.includes(c.name))
        )

        for (const c of toCheck) {
            let success = await c.check(ctx, args)
            if (!success) return { success: false, checkName: c.name }
        }

        return { success: true, checkName: "" }
    }

    addCheck(name: string, func: CheckFunc, checkData: CheckData = {}) {
        let c = {
            name,
            description: checkData.description ?? "",
            global: checkData.global ?? false,
            check: func
        }

        if (c.global)
            this._globalChecks.push(c)
        else
            this._checks.push(c)
    }

    addCommand(name: string, func: CommandFunc, commandData: CommandData = {}) {
        this._commands.push({
            name,
            aliases: commandData.aliases ?? [],
            description: commandData.description ?? "",
            check: commandData.check ?? [],
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

        const ctx = new Context({
            args,
            bot: this,
            command: cmd,
            message: msg,
            invokedWith: cmdName
        })

        try {
            const { success, checkName } = await this._check(ctx, args)
            if (!success)
                throw new Error("Check failed: " + checkName)
        } catch (err) {
            this.emit("checkError", ctx, err)
            return true
        }

        try {
            await cmd.execute(ctx, args)
        } catch (err) {
            this.emit("commandError", ctx, err)
        }

        return true
    }

    get checks() {
        return this._checks.concat(this._globalChecks)
    }

    get commands() {
        return this._commands
    }
}
