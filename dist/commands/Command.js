"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
/**
 * A class that implements the protocol for a bot text command. Do not use this to create a command instead use for example `Bot.addCommand`
 */
class Command {
    /**
     * @param name name of the command
     * @param func the function executed upon command's invoke
     * @param data additional command options
     * @example new Command("ping", async (ctx, args) => await ctx.send(bot.ws.ping + "ms"), {})
     */
    constructor(name, func, data) {
        var _a, _b, _c, _d;
        this.name = name;
        this.callback = func;
        this.aliases = (_a = data.aliases) !== null && _a !== void 0 ? _a : [];
        this.description = (_b = data.description) !== null && _b !== void 0 ? _b : "";
        this.check = (_c = data.check) !== null && _c !== void 0 ? _c : [];
        this.cog = (_d = data.cog) !== null && _d !== void 0 ? _d : null;
    }
}
exports.Command = Command;
