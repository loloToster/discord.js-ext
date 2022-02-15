import { Client, ClientEvents, ClientOptions, Message } from "discord.js";
import { Check, CheckFunc, CheckData } from "./Check";
import { Cog, RawCog } from "./Cog";
import { Command, CommandData, CommandFunc } from "./Command";
import { Context } from "./Context";
import { Loop, LoopOptions } from "../tasks/Loop";
export declare type Prefix = string[] | ((bot: Bot, msg: Message) => string | Promise<string>);
export interface BotOptions extends ClientOptions {
    /**
     * The prefix of Bot's commands. Can be either a single prefix (string), list of prefixes (Array of strings) or a function that takes two parameters - the bot and the message - and returns a prefix used for processing this message
     */
    prefix: string | Prefix;
}
export interface Extension {
    /**
     * The setup function
     */
    setup: (bot: Bot) => any;
    teardown?: (bot: Bot) => any;
}
export interface BotEvents extends ClientEvents {
    /**
     * emitted when a check throws an error or fails
     */
    checkError: [ctx: Context, err: unknown];
    /**
     * emitted when a command throws an error
     */
    commandError: [ctx: Context, err: unknown];
    /**
     * emitted when a command is not found
     */
    commandNotFound: [msg: Message, cmdName: string, args: string[]];
}
export interface Bot {
    /** @ignore */
    on<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this;
    /** @ignore */
    once<K extends keyof BotEvents>(event: K, listener: (...args: BotEvents[K]) => any): this;
    /** @ignore */
    emit<K extends keyof BotEvents>(event: K, ...args: BotEvents[K]): boolean;
}
declare type loopFunc = (...args: any[]) => any;
/**
 * Represents a discord bot. This class is a subclass of Client class from the official discord.js package and as a result anything that you can do with a Client you can do with this bot.
 */
export declare class Bot extends Client {
    /**
     * The prefix of the bot
     */
    prefix: Prefix;
    private _commands;
    private _checks;
    private _globalChecks;
    private _cogs;
    private _loops;
    /**
     * @param options Options for the bot (These options extend ClientOptions from discord.js)
     * @example new Bot({ prefix: "!" })
     */
    constructor(options: BotOptions);
    private _commandHandler;
    private _check;
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
    addCheck(name: string, func: CheckFunc, checkData?: CheckData): void;
    /**
     * List of Bot's checks 🚨 readonly
     */
    get checks(): Check[];
    set checks(_: Check[]);
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
    addCommand(name: string, func: CommandFunc, commandData?: CommandData): void;
    /**
     * Looks for a command
     * @param query name or the alias of the command
     * @param useAliases parameter that determines whether a command should be looked for with aliases
     * @returns found command
     * @example let pingCommand = bot.getCommand("ping")
     */
    getCommand(query: string, useAliases?: boolean): Command | undefined;
    /**
     * Executes a command (used primarily internally)
     * @param msg the message which the command is invoked with
     * @param cmdName name of the command
     * @param args arguments
     * @returns boolean indicating whether the command was found
     */
    executeCommand(msg: Message, cmdName: string, args: string[]): Promise<boolean>;
    /**
     * List of all commands 🚨 readonly
     */
    get commands(): Command[];
    set commands(_: Command[]);
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
    addCog(data: RawCog): void;
    /**
     * List of the Bot's cogs 🚨 readonly
     */
    get cogs(): Cog[];
    set cogs(_: Cog[]);
    /**
     * Looks for a cog
     * @param name the name of the cog
     * @returns found cog
     * @example let TestCog = bot.getCog("Test")
     */
    getCog(name: string): Cog | undefined;
    private _isExt;
    /**
     * Loads external file as the extension. This file must export a function called `setup` that takes one parameter: the Bot
     * @param path absolute path to the extension
     * @example bot.loadExtension(__dirname + "/cogs/Test.js")
     */
    loadExtension(path: string): void;
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
    loop(func: loopFunc, loopData: LoopOptions): Loop;
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
    loop(name: string, func: loopFunc, loopData: LoopOptions): Loop;
    /**
     * [key]: Loop mapping of the loops added with `name` parameter 🚨 readonly
     */
    get loops(): Record<string, Loop>;
    set loops(_: Record<string, Loop>);
}
export {};
