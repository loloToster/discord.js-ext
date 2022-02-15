"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const discord_js_1 = require("discord.js");
const Check_1 = require("./Check");
const Cog_1 = require("./Cog");
const Command_1 = require("./Command");
const Context_1 = require("./Context");
const Loop_1 = require("../tasks/Loop");
/**
 * Represents a discord bot. This class is a subclass of Client class from the official discord.js package and as a result anything that you can do with a Client you can do with this bot.
 */
class Bot extends discord_js_1.Client {
    /**
     * @param options Options for the bot (These options extend ClientOptions from discord.js)
     * @example new Bot({ prefix: "!" })
     */
    constructor(options) {
        super(options);
        this.prefix = typeof options.prefix === "string" ?
            [options.prefix] :
            options.prefix;
        this._commands = [];
        this._checks = [];
        this._globalChecks = [];
        this._cogs = [];
        this._loops = {};
        this.on("messageCreate", this._commandHandler);
    }
    _commandHandler(msg) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const prefixes = typeof this.prefix === "function" ?
                [yield this.prefix(this, msg)] : this.prefix;
            let content = msg.content;
            for (const prefix of prefixes) {
                if (!content.startsWith(prefix))
                    continue;
                content = content.substring(prefix.length);
                let args = content.split(/ +/g);
                let command = (_a = args.shift()) !== null && _a !== void 0 ? _a : "";
                let found = yield this.executeCommand(msg, command, args);
                if (!found)
                    this.emit("commandNotFound", msg, command, args);
            }
        });
    }
    _check(ctx, args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const toCheck = this._globalChecks.concat(this._checks.filter(c => ctx.command.check.includes(c.name)), (_b = (_a = ctx.command.cog) === null || _a === void 0 ? void 0 : _a.checks.filter(c => c.global || ctx.command.check.includes(c.name))) !== null && _b !== void 0 ? _b : []);
            for (const c of toCheck) {
                let success = yield c.callback(ctx, args);
                if (!success)
                    return { success: false, checkName: c.name };
            }
            return { success: true, checkName: "" };
        });
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
    addCheck(name, func, checkData = {}) {
        checkData.cog = undefined;
        const check = new Check_1.Check(name, func, checkData);
        if (check.global)
            this._globalChecks.push(check);
        else
            this._checks.push(check);
    }
    /**
     * List of Bot's checks 🚨 readonly
     */
    get checks() {
        let cogsChecks = [];
        this._cogs.forEach(c => c.checks.forEach(chck => cogsChecks.push(chck)));
        return this._checks.concat(this._globalChecks, cogsChecks);
    }
    set checks(_) { throw new Error("Cannot set checks property"); }
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
    addCommand(name, func, commandData = {}) {
        commandData.cog = undefined;
        this._commands.push(new Command_1.Command(name, func, commandData));
    }
    /**
     * Looks for a command
     * @param query name or the alias of the command
     * @param useAliases parameter that determines whether a command should be looked for with aliases
     * @returns found command
     * @example let pingCommand = bot.getCommand("ping")
     */
    getCommand(query, useAliases = true) {
        return this._commands.find(cmd => cmd.name === query || (useAliases && cmd.aliases.some(a => a === query)));
    }
    /**
     * Executes a command (used primarily internally)
     * @param msg the message which the command is invoked with
     * @param cmdName name of the command
     * @param args arguments
     * @returns boolean indicating whether the command was found
     */
    executeCommand(msg, cmdName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!cmdName)
                return false;
            const cmd = this.getCommand(cmdName);
            if (!cmd)
                return false;
            const ctx = new Context_1.Context({
                args,
                bot: this,
                command: cmd,
                message: msg,
                invokedWith: cmdName
            });
            try {
                const { success, checkName } = yield this._check(ctx, args);
                if (!success)
                    throw new Error("Check failed: " + checkName);
            }
            catch (err) {
                this.emit("checkError", ctx, err);
                return true;
            }
            try {
                yield cmd.callback(ctx, args);
            }
            catch (err) {
                this.emit("commandError", ctx, err);
            }
            return true;
        });
    }
    /**
     * List of all commands 🚨 readonly
     */
    get commands() {
        return this._commands;
    }
    set commands(_) { throw new Error("Cannot set commands property"); }
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
    addCog(data) {
        let newCog = new Cog_1.Cog(data);
        this._commands = this._commands.concat(newCog.commands);
        for (const listener of newCog.listeners) {
            if (listener.on)
                this.on(listener.event, listener.on);
            else
                this.once(listener.event, listener.once);
        }
        this._cogs.push(newCog);
        if (data.init)
            data.init(this);
    }
    /**
     * List of the Bot's cogs 🚨 readonly
     */
    get cogs() {
        return this._cogs;
    }
    set cogs(_) { throw new Error("Cannot set cogs property"); }
    /**
     * Looks for a cog
     * @param name the name of the cog
     * @returns found cog
     * @example let TestCog = bot.getCog("Test")
     */
    getCog(name) {
        return this._cogs.find(c => c.name === name);
    }
    _isExt(obj) {
        return typeof obj.setup === "function" && // setup must be a function
            (typeof obj.teardown === "function" || // teardown must be either function
                typeof obj.teardown === "undefined"); // or undefined
    }
    /**
     * Loads external file as the extension. This file must export a function called `setup` that takes one parameter: the Bot
     * @param path absolute path to the extension
     * @example bot.loadExtension(__dirname + "/cogs/Test.js")
     */
    loadExtension(path) {
        let ext = require(path);
        if (!this._isExt(ext))
            throw new Error("Invalid extension");
        ext.setup(this);
    }
    loop(x, y, z) {
        if (typeof x === "function" && typeof y !== "function" && z === undefined) {
            y.func = x;
            return new Loop_1.Loop(y);
        }
        else if (typeof x === "string" && typeof y === "function" && z !== undefined) {
            z.func = y;
            let loop = new Loop_1.Loop(z);
            this._loops[x] = loop;
            return loop;
        }
        throw new Error("Invalid arguments");
    }
    /**
     * [key]: Loop mapping of the loops added with `name` parameter 🚨 readonly
     */
    get loops() {
        return this._loops;
    }
    set loops(_) { throw new Error("Cannot set loops property"); }
}
exports.Bot = Bot;
