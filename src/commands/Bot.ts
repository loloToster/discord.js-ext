import { Client, ClientEvents, ClientOptions, Message } from "discord.js"

import { Check, CheckFunc, CheckData } from "./Check"
import { Cog, RawCog } from "./Cog"
import { Command, CommandData, CommandFunc } from "./Command"
import { Context } from "./Context"

import { Loop, LoopOptions } from "../tasks/Loop"

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
    once<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this,
    emit<K extends keyof BotEvents>(event: K, ...args: BotEvents[K]): boolean
}

type loopFunc = (...args: any[]) => any

export class Bot extends Client {
    prefix: Prefix

    private _commands: Command[]
    private _checks: Check[]
    private _globalChecks: Check[]
    private _cogs: Cog[]

    _loops: Record<string, Loop>

    constructor(options: BotOptions) {
        super(options)

        this.prefix = typeof options.prefix === "string" ?
            [options.prefix] :
            options.prefix

        this._commands = []
        this._checks = []
        this._globalChecks = []
        this._cogs = []

        this._loops = {}

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
            this._checks.filter(c => ctx.command.check.includes(c.name)),
            ctx.command.cog?.checks.filter(
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

        if (check.global) this._globalChecks.push(check)
        else this._checks.push(check)
    }

    get checks() {
        let cogsChecks: Check[] = []
        this._cogs.forEach(c => c.checks.forEach(chck => cogsChecks.push(chck)))
        return this._checks.concat(this._globalChecks, cogsChecks)
    }

    set checks(_) { throw new Error("Cannot set checks property") }

    addCommand(name: string, func: CommandFunc, commandData: CommandData = {}) {
        commandData.cog = undefined
        this._commands.push(new Command(name, func, commandData))
    }

    getCommand(query: string, useAliases: boolean = true) {
        return this._commands.find(
            cmd => cmd.name === query || (useAliases && cmd.aliases.some(a => a === query))
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

    get commands() {
        return this._commands
    }

    set commands(_) { throw new Error("Cannot set commands property") }

    addCog(data: RawCog) {
        let newCog = new Cog(data)
        this._commands = this._commands.concat(newCog.commands)

        for (const listener of newCog.listeners) {
            if (listener.on)
                this.on(listener.event, listener.on)
            else
                this.once(listener.event, listener.once)
        }

        this._cogs.push(newCog)
        if (data.init) data.init(this)
    }

    get cogs() {
        return this._cogs
    }

    set cogs(_) { throw new Error("Cannot set cogs property") }

    getCog(name: string) {
        return this._cogs.find(c => c.name === name)
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

    loop(func: loopFunc, loopData: LoopOptions): Loop
    loop(name: string, func: loopFunc, loopData: LoopOptions): Loop
    loop(x: loopFunc | string, y: LoopOptions | loopFunc, z?: LoopOptions) {
        if (typeof x === "function" && typeof y !== "function" && z === undefined) {
            y.func = x
            return new Loop(y)
        } else if (typeof x === "string" && typeof y === "function" && z !== undefined) {
            z.func = y
            let loop = new Loop(z)
            this._loops[x] = loop
            return loop
        }
        throw new Error("Invalid arguments")
    }

    get loops() {
        return this._loops
    }

    set loops(_) { throw new Error("Cannot set loops property") }
}
