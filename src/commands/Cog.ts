import { Bot, Check } from ".."
import { Command, RawCommand } from "./Command"

type initFunc = (bot: Bot) => any
type RawCogElement = RawCommand | Check | string | undefined | initFunc

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
    private commands: Command[]

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


            if (this._isCheck(element))
                this.checks.push({
                    name: element.name ?? key,
                    description: element.description ?? "",
                    global: element.global ?? false,
                    check: element.check,
                    cog: this
                })
            else if (this._isRawCommand(element))
                this.commands.push(new Command(element.name ?? key,
                    element.command,
                    {
                        description: element.description ?? "",
                        aliases: element.aliases ?? [],
                        check: element.check ?? [],
                        cog: this
                    }
                ))
        }
    }

    private _isCheck(obj: RawCommand | Check): obj is Check {
        return typeof obj.check === "function"
    }

    private _isRawCommand(obj: any): obj is RawCommand {
        return typeof obj.command === "function"
    }

    getCommands() {
        return this.commands
    }

    getChecks() {
        return this.checks
    }
}
