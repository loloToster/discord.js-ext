import { Client, ClientEvents, ClientOptions, Message } from "discord.js"

import { Check, CheckFunc, CheckData } from "./Check"
import { Cog, RawCog } from "./Cog"
import { Command, CommandData, CommandFunc } from "./Command"
import { Context } from "./Context"

import { Loop, LoopOptions } from "../tasks/Loop"

export type Prefix = string[] | ((bot: Bot, msg: Message) => string | Promise<string>)

export interface BotOptions extends ClientOptions {
    /**
     * The prefix of Bot's commands. Can be either a single prefix (string), list of prefixes (Array of strings) or a function that takes two parameters - the bot and the message - and returns a prefix used for processing this message 
     */
    prefix: string | Prefix
}

export interface Extension {
    /**
     * The setup function
     */
    setup: (bot: Bot) => any,
    teardown?: (bot: Bot) => any // TODO: add unload extension
}

export interface BotEvents extends ClientEvents {
    /**
     * emitted when a check throws an error or fails
     */
    checkError: [ctx: Context, err: unknown],
    /**
     * emitted when a command throws an error
     */
    commandError: [ctx: Context, err: unknown],
    /**
     * emitted when a command is not found
     */
    commandNotFound: [msg: Message, cmdName: string, args: string[]]
}

export interface Bot { // TODO: scoped events
    /** @ignore */
    on<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this,
    /** @ignore */
    once<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this,
    /** @ignore */
    emit<K extends keyof BotEvents>(event: K, ...args: BotEvents[K]): boolean
}

type loopFunc = (...args: any[]) => any

/**
 * Represents a discord bot. This class is a subclass of Client class from the official discord.js package and as a result anything that you can do with a Client you can do with this bot.
 */
export class Bot extends Client {
    /**
     * The prefix of the bot
     */
    prefix: Prefix

    private _commands: Command[]
    private _checks: Check[]
    private _globalChecks: Check[]
    private _cogs: Cog[]

    private _loops: Record<string, Loop>

    /**
     * @param options Options for the bot (These options extend ClientOptions from discord.js)
     * @example new Bot({ prefix: "!" })
     */
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

    /**
     * Adds a check that can be accessed everywhere
     * @param name name of the check
     * @param func function validating the check
     * @param checkData additional check options
     * @example 
     * bot.addCheck("inVoice", (ctx, args) => {
     *     return Boolean(ctx.message.member.voice.channel)
     * })
     */
    addCheck(name: string, func: CheckFunc, checkData: CheckData = {}) {
        checkData.cog = undefined

        const check = new Check(name, func, checkData)

        if (check.global) this._globalChecks.push(check)
        else this._checks.push(check)
    }

    /**
     * List of Bot's checks 🚨 readonly
     */
    get checks() {
        let cogsChecks: Check[] = []
        this._cogs.forEach(c => c.checks.forEach(chck => cogsChecks.push(chck)))
        return this._checks.concat(this._globalChecks, cogsChecks)
    }

    set checks(_) { throw new Error("Cannot set checks property") }

    /**
     * Adds a command
     * @param name name of the command
     * @param func the function executed upon command's invoke
     * @param commandData additional command options
     * @example
     * bot.addCommand("ping", async (ctx, args) => {
     *     await ctx.reply(bot.ws.ping + "ms")
     * }, { aliases: ["latency"] })
     */
    addCommand(name: string, func: CommandFunc, commandData: CommandData = {}) {
        commandData.cog = undefined
        this._commands.push(new Command(name, func, commandData))
    }

    /**
     * Looks for a command
     * @param query name or the alias of the command
     * @param useAliases parameter that determines whether a command should be looked for with aliases
     * @returns found command
     * @example let pingCommand = bot.getCommand("ping")
     */
    getCommand(query: string, useAliases: boolean = true) {
        return this._commands.find(
            cmd => cmd.name === query || (useAliases && cmd.aliases.some(a => a === query))
        )
    }

    /**
     * Executes a command (used primarily internally)
     * @param msg the message which the command is invoked with
     * @param cmdName name of the command
     * @param args arguments
     * @returns boolean indicating whether the command was found
     */
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

    /**
     * List of all commands 🚨 readonly
     */
    get commands() {
        return this._commands
    }

    set commands(_) { throw new Error("Cannot set commands property") }

    /**
     * Adds a cog to the Bot
     * @param data object containing raw cog data
     * @example 
     * bot.addCog({
     *     name: "Test"
     *     init: bot => console.log("Initializing Test Cog")
     *     ping: {
     *          aliases: ["latency"],
     *          description: "Sends bot's latency",
     *          command: async (ctx, args) => {
     *              await ctx.reply(bot.ws.ping + "ms")
     *          }
     *     },
     *     messageCreate: {
     *          on: msg => console.log(msg) 
     *     }
     * })
     */
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

    /**
     * List of the Bot's cogs 🚨 readonly
     */
    get cogs() {
        return this._cogs
    }

    set cogs(_) { throw new Error("Cannot set cogs property") }

    /**
     * Looks for a cog
     * @param name the name of the cog
     * @returns found cog
     * @example let TestCog = bot.getCog("Test")
     */
    getCog(name: string) {
        return this._cogs.find(c => c.name === name)
    }

    private _isExt(obj: any): obj is Extension {
        return typeof obj.setup === "function" && // setup must be a function
            (typeof obj.teardown === "function" || // teardown must be either function
                typeof obj.teardown === "undefined") // or undefined
    }

    /**
     * Loads external file as the extension. This file must export a function called `setup` that takes one parameter: the Bot
     * @param path absolute path to the extension
     * @example bot.loadExtension(__dirname + "/cogs/Test.js")
     */
    loadExtension(path: string) {
        let ext = require(path)

        if (!this._isExt(ext)) throw new Error("Invalid extension")

        ext.setup(this)
    }

    /**
     * Creates a loop
     * @param func function to be executed on each loop
     * @param loopData the options to be used when creating the loop
     * @returns newly created loop
     * @example
     * bot.loop(async (ctx) => {
     *     await ctx.send(".")
     * }, { seconds: 2, count: 5 }).start(ctx)
     */
    loop(func: loopFunc, loopData: Partial<LoopOptions>): Loop
    /**
     * Creates a loop
     * @param name the name of the loop (can be then accessed as key in `bot.loops[name]`)
     * @param func function to be executed on each loop
     * @param loopData the options to be used when creating the loop
     * @returns newly created loop
     * @example
     * bot.loop("spammer", async (ctx) => {
     *     await ctx.send(".")
     * }, { seconds: 2 }).start(ctx)
     */
    loop(name: string, func: loopFunc, loopData: Partial<LoopOptions>): Loop
    loop(x: loopFunc | string, y: Partial<LoopOptions> | loopFunc, z?: Partial<LoopOptions>) {
        if (typeof x === "function" && typeof y !== "function" && z === undefined) {
            y.func = x
            return new Loop(y as LoopOptions)
        } else if (typeof x === "string" && typeof y === "function" && z !== undefined) {
            z.func = y
            let loop = new Loop(z as LoopOptions)
            this._loops[x] = loop
            return loop
        }
        throw new Error("Invalid arguments")
    }

    /**
     * [key]: Loop mapping of the loops added with `name` parameter 🚨 readonly
     */
    get loops() {
        return this._loops
    }

    set loops(_) { throw new Error("Cannot set loops property") }
}
