import { Bot, Command, Check } from ".."

type initFunc = (bot: Bot) => any
type RawCogElement = Command | Check | string | undefined | initFunc

export interface RawCog {
    init?: initFunc
    name: string,
    description?: string,
    [name: string]: RawCogElement
}

export class Cog {
    name: string
    description: string

    private checks: Required<Check>[]
    private commands: Required<Command>[]

    constructor(data: RawCog) {
        this.name = data.name
        this.description = data.description ?? ""

        this.checks = []
        this.commands = []

        for (const key in data) {
            const element = data[key]

            if (typeof element === "string" ||
                typeof element === "undefined" ||
                typeof element === "function") continue


            if (this._isCheck(element)) {
                this.checks.push({
                    name: element.name ?? key,
                    description: element.description ?? "",
                    global: element.global ?? false,
                    check: element.check,
                    cog: this
                })
            } else if (this._isCommand(element)) {
                const cmd = {
                    name: element.name ?? key,
                    description: element.description ?? "",
                    aliases: element.aliases ?? [],
                    check: element.check ?? [],
                    command: element.command,
                    cog: this
                }

                this.commands.push(cmd)
            }
        }
    }

    private _isCheck(obj: Command | Check): obj is Check {
        return typeof obj.check === "function"
    }

    private _isCommand(obj: any): obj is Command {
        return typeof obj.command === "function"
    }

    getCommands() {
        return this.commands
    }

    getChecks() {
        return this.checks
    }
}
