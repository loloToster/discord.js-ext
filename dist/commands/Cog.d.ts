import { Bot, BotEvents } from "..";
import { RawCheck, Check } from "./Check";
import { Command, RawCommand } from "./Command";
declare type initFunc = (bot: Bot) => any;
interface CogOnListener {
    /**
     * The name of the event (defaults to the key of the cog)
     */
    event?: keyof BotEvents;
    /**
     * The function to be called when event is emitted
     * @param args
     */
    on<K extends keyof BotEvents>(...args: BotEvents[K]): this;
    once: undefined;
}
interface CogOnceListener {
    /**
    * The name of the event (defaults to the key of the cog)
    */
    event?: keyof BotEvents;
    /**
     * The function to be called when event is emitted
     * @param args
     */
    once<K extends keyof BotEvents>(...args: BotEvents[K]): this;
    on: undefined;
}
declare type RawCogElement = RawCommand | RawCheck | CogOnListener | CogOnceListener | string | undefined | initFunc;
export interface RawCog {
    /**
     * The function that is called when adding cog
     */
    init?: initFunc;
    /**
     * The name of the cog
     */
    name: string;
    /**
     * The description of the cog
     */
    description?: string;
    [name: string]: RawCogElement;
}
declare type CogListener = Required<CogOnListener> | Required<CogOnceListener>;
/**
 * A cog is a collection of commands, listeners etc. to help group commands together.
 */
export declare class Cog {
    /**
     * The name of the cog
     */
    readonly name: string;
    /**
     * The description of the cog
     */
    description: string;
    private _checks;
    private _commands;
    private _listeners;
    /**
     * @param data object containing raw cog data
     */
    constructor(data: RawCog);
    private static _isRawCheck;
    /**
     * List of cog's checks 🚨 readonly
     */
    get checks(): Check[];
    set checks(_: Check[]);
    private static _isRawCommand;
    /**
     * List of cog's commands 🚨 readonly
     */
    get commands(): Command[];
    set commands(_: Command[]);
    private static _isListener;
    /**
     * List of cog's listeners 🚨 readonly
     */
    get listeners(): CogListener[];
    set listeners(_: CogListener[]);
}
export {};
