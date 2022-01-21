import { Client, ClientEvents, ClientOptions, Message } from "discord.js"

import { Check, CheckFunc, CheckData } from "./Check"
import { Cog, RawCog } from "./Cog"
import { Command, CommandData, CommandFunc } from "./Command"
import { Context } from "./Context"

export type Prefix = string[] | ((bot: Bot, msg: Message) => string | Promise<string>)

export interface BotOptions extends ClientOptions {
    prefix: string | Prefix
}

export interface Extension {
    setup: (bot: Bot) => any,
    teardown?: (bot: Bot) => any // TODO: add unload extension
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

    private commands: Command[]
    private checks: Check[]
    private globalChecks: Check[]
    private cogs: Cog[]

    constructor(options: BotOptions) {
        super(options)

        this.prefix = typeof options.prefix === "string" ?
            this.prefix = [options.prefix] :
            this.prefix = options.prefix

        this.commands = []
        this.checks = []
        this.globalChecks = []
        this.cogs = []

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
        const toCheck = this.globalChecks.concat(
            this.checks.filter(c => ctx.command.check.includes(c.name)),
            ctx.command.cog?.getChecks().filter(
                c => c.global || ctx.command.check.includes(c.name)
            ) ?? []
        )

        for (const c of toCheck) {
            let success = await c.callback(ctx, args)
            if (!success) return { success: false, checkName: c.name }
        }

        return { success: true, checkName: "" }
    }

    addCheck(name: string, func: CheckFunc, checkData: CheckData = {}) {
        checkData.cog = undefined

        const check = new Check(name, func, checkData)

        if (check.global) this.globalChecks.push(check)
        else this.checks.push(check)
    }

    addCommand(name: string, func: CommandFunc, commandData: CommandData = {}) {
        commandData.cog = undefined
        this.commands.push(new Command(name, func, commandData))
    }

    getCommand(name: string) {
        return this.commands.find(
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
            await cmd.callback(ctx, args)
        } catch (err) {
            this.emit("commandError", ctx, err)
        }

        return true
    }

    getChecks() {
        let cogsChecks: Check[] = []
        this.cogs.forEach(c => c.getChecks().forEach(chck => cogsChecks.push(chck)))
        return this.checks.concat(this.globalChecks, cogsChecks)
    }

    getCommands() {
        return this.commands
    }

    addCog(data: RawCog) {
        let newCog = new Cog(data)

        this.commands = this.commands.concat(newCog.getCommands())

        this.cogs.push(newCog)

        if (data.init) data.init(this)
    }

    getCogs() {
        return this.cogs
    }

    private _isExt(obj: any): obj is Extension {
        return typeof obj.setup === "function" && // setup must be a function
            (typeof obj.teardown === "function" || // teardown must be either function
                typeof obj.teardown === "undefined") // or undefined
    }

    loadExtension(path: string) {
        let ext = require(path)

        if (!this._isExt(ext)) throw new Error("Invalid extension")

        ext.setup(this)
    }
}
