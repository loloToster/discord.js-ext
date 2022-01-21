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
    args: string[],
    bot: Bot,
    message: Message,
    command: Required<Command>,
    invokedWith: string
}

export interface Context extends ContextParameters { }
export class Context {
    author: User
    channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel
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

    async send(options: string | MessagePayload | MessageOptions) {
        return await this.channel.send(options)
    }

    async reply(options: string | MessagePayload | ReplyMessageOptions) {
        return await this.message.reply(options)
    }
}
