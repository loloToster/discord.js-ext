import { Bot, BotEvents } from ".."
import { RawCheck, Check } from "./Check"
import { Command, RawCommand } from "./Command"

type initFunc = (bot: Bot) => any

interface CogOnListener {
    event?: keyof BotEvents,
    on<K extends keyof BotEvents>(...args: BotEvents[K]): this,
    once: undefined
}

interface CogOnceListener {
    event?: keyof BotEvents,
    once<K extends keyof BotEvents>(...args: BotEvents[K]): this,
    on: undefined
}

type RawCogElement = RawCommand | RawCheck | CogOnListener | CogOnceListener | string | undefined | initFunc

export interface RawCog {
    init?: initFunc
    name: string,
    description?: string,
    [name: string]: RawCogElement
}

type CogListener = Required<CogOnListener> | Required<CogOnceListener>

export class Cog {
    readonly name: string
    description: string

    private _checks: Check[]
    private _commands: Command[]
    private _listeners: CogListener[]

    constructor(data: RawCog) {
        this.name = data.name
        this.description = data.description ?? ""

        this._checks = []
        this._commands = []
        this._listeners = []

        for (const key in data) {
            const element = data[key]

            if (typeof element === "string" ||
                typeof element === "undefined" ||
                typeof element === "function") continue


            if (Cog._isRawCheck(element))
                this._checks.push(
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
            else if (Cog._isRawCommand(element))
                this._commands.push(
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
            else if (Cog._isListener(element)) {
                let event = element.event ?? key as keyof BotEvents
                element.event = event
                this._listeners.push(element as CogListener)
            }
        }
    }

    private static _isRawCheck(obj: any): obj is RawCheck {
        return typeof obj.check === "function"
    }

    get checks() {
        return this._checks
    }

    set checks(_) { throw new Error("Cannot set checks property") }

    private static _isRawCommand(obj: any): obj is RawCommand {
        return typeof obj.command === "function"
    }

    get commands() {
        return this._commands
    }

    set commands(_) { throw new Error("Cannot set commands property") }

    private static _isListener(obj: any): obj is CogOnListener | CogOnceListener {
        return typeof obj.on === "function" || typeof obj.once === "function"
    }

    get listeners() {
        return this._listeners
    }

    set listeners(_) { throw new Error("Cannot set listeners property") }
}
