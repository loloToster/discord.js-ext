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
exports.Context = void 0;
/**
 * Represents the context in which a command is being invoked under.
 */
class Context {
    constructor(ctxParams) {
        this.args = ctxParams.args;
        this.author = ctxParams.message.author;
        this.bot = ctxParams.bot;
        this.channel = ctxParams.message.channel;
        this.message = ctxParams.message;
        this.command = ctxParams.command;
        this.guild = ctxParams.message.guild;
        this.invokedWith = ctxParams.invokedWith;
    }
    /**
     * This is a shortcut to `ctx.message.send`
     * @example await ctx.send("Hello there")
     */
    send(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.channel.send(options);
        });
    }
    /**
     * This is a shortcut to `ctx.message.reply`
     * @example await ctx.reply("Hello there")
     */
    reply(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.message.reply(options);
        });
    }
}
exports.Context = Context;
