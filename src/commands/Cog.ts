import { Bot } from ".."
import { RawCheck, Check } from "./Check"
import { Command, RawCommand } from "./Command"

type initFunc = (bot: Bot) => any
type RawCogElement = RawCommand | RawCheck | string | undefined | initFunc

export interface RawCog {
    init?: initFunc
    name: string,
    description?: string,
    [name: string]: RawCogElement
}

export class Cog {
    name: string
    description: string

    private checks: Check[]
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


            if (this._isRawCheck(element))
                this.checks.push(
                    new Check(
                        element.name ?? key,
                        element.check,
                        {
                            description: element.description,
                            global: element.global,
                            cog: this
                        }
                    )
                )
            else if (this._isRawCommand(element))
                this.commands.push(
                    new Command(
                        element.name ?? key,
                        element.command,
                        {
                            description: element.description,
                            aliases: element.aliases,
                            check: element.check,
                            cog: this
                        }
                    )
                )
        }
    }

    private _isRawCheck(obj: any): obj is RawCheck {
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
