import { DMChannel, Guild, Message, MessageOptions, MessagePayload, NewsChannel, PartialDMChannel, ReplyMessageOptions, TextChannel, ThreadChannel, User } from "discord.js";
import { Bot } from "./Bot";
import { Command } from "./Command";
export interface ContextParameters {
    /**
     * The list of arguments that were passed into the command
     */
    args: string[];
    /**
     * The bot in which the context was created in
     */
    bot: Bot;
    /**
     * The message that triggered the command being executed
     */
    message: Message;
    /**
     * The command that is being invoked currently
     */
    command: Required<Command>;
    /**
     * The command name that triggered this invocation (includes aliases)
     */
    invokedWith: string;
}
export interface Context extends ContextParameters {
}
/**
 * Represents the context in which a command is being invoked under.
 */
export declare class Context {
    /**
     * The author associated with this context's command (same as Context.message.author)
     */
    author: User;
    /**
     * The channel associated with this context's command (same as Context.message.channel)
     */
    channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel;
    /**
     * The guild associated with this context's command (same as Context.message.guild)
     */
    guild: Guild | null;
    constructor(ctxParams: ContextParameters);
    /**
     * This is a shortcut to `ctx.message.send`
     * @example await ctx.send("Hello there")
     */
    send(options: string | MessagePayload | MessageOptions): Promise<Message<boolean>>;
    /**
     * This is a shortcut to `ctx.message.reply`
     * @example await ctx.reply("Hello there")
     */
    reply(options: string | MessagePayload | ReplyMessageOptions): Promise<Message<boolean>>;
}
