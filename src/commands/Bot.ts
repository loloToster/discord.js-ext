import { Client, ClientOptions, Message } from "discord.js";

type PrefixFunc = (bot: Bot, msg: Message) => string | Promise<string>
type Prefix = string[] | PrefixFunc

export interface BotOptions {
    prefix: string | Prefix
}

type CommandFunc = (msg: Message, args: string[], bot: Bot) => any

export interface Command {
    name: string,
    execute: CommandFunc
}

export class Bot extends Client {

    prefix: Prefix
    commands: Command[]

    constructor(botOptions: BotOptions, clientOptions: ClientOptions) {
        super(clientOptions)

        if (typeof botOptions.prefix === "string")
            this.prefix = [botOptions.prefix]
        else
            this.prefix = botOptions.prefix

        this.commands = []

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
            let command = args.shift()

            await this.executeCommand(msg, command ?? "", args)
        }
    }

    addCommand(name: string, func: CommandFunc) {
        this.commands.push({
            name,
            execute: func
        })
    }

    getCommand(name: string) {
        return this.commands.find(cmd => cmd.name === name)
    }

    async executeCommand(msg: Message, cmdName: string, args: string[]) {
        if (!cmdName) return
        const cmd = this.getCommand(cmdName)
        if (!cmd) return

        await cmd.execute(msg, args, this)
    }
}
