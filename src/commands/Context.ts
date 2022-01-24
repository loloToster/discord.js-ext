import {
    DMChannel,
    Guild,
    Message,
    MessageOptions,
    MessagePayload,
    NewsChannel,
    PartialDMChannel,
    ReplyMessageOptions,
    TextChannel,
    ThreadChannel,
    User
} from "discord.js"

import { Bot } from "./Bot"
import { Command } from "./Command"

export interface ContextParameters {
    /**
     * The list of arguments that were passed into the command
     */
    args: string[],
    /**
     * The bot in which the context was created in
     */
    bot: Bot,
    /**
     * The message that triggered the command being executed
     */
    message: Message,
    /**
     * The command that is being invoked currently
     */
    command: Required<Command>,
    /**
     * The command name that triggered this invocation (includes aliases)
     */
    invokedWith: string
}

export interface Context extends ContextParameters { }

/**
 * This class is used to create contexts and should only be used internally
 */
export class Context {
    /**
     * The author associated with this context's command (same as Context.message.author)
     */
    author: User
    /**
     * The channel associated with this context's command (same as Context.message.channel)
     */
    channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel
    /**
     * The guild associated with this context's command (same as Context.message.guild)
     */
    guild: Guild | null

    constructor(ctxParams: ContextParameters) {
        this.args = ctxParams.args
        this.author = ctxParams.message.author
        this.bot = ctxParams.bot
        this.channel = ctxParams.message.channel
        this.message = ctxParams.message
        this.command = ctxParams.command
        this.guild = ctxParams.message.guild
        this.invokedWith = ctxParams.invokedWith
    }

    /**
     * This is a shortcut to `ctx.message.send`
     * @example await ctx.send("Hello there")
     */
    async send(options: string | MessagePayload | MessageOptions) {
        return await this.channel.send(options)
    }

    /**
     * This is a shortcut to `ctx.message.reply`
     * @example await ctx.reply("Hello there")
     */
    async reply(options: string | MessagePayload | ReplyMessageOptions) {
        return await this.message.reply(options)
    }
}
