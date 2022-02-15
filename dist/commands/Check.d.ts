import { Cog } from "./Cog";
import { Context } from "./Context";
export declare type CheckFunc = (ctx: Context, args: string[]) => Promise<boolean> | boolean;
export interface CheckData {
    /**
     * The description of the check
     */
    description?: string;
    /**
     * Parameter that determines whether a check should be called before every command
     */
    global?: boolean;
    cog?: Cog;
}
export interface RawCheck extends CheckData {
    /**
     * The name of the check
     */
    name?: string;
    /**
     * The function validating the check
     */
    check: CheckFunc;
}
/**
 * This class represents a check. Do not use this to create a check instead use for example `Bot.addCheck`
 */
export declare class Check {
    /**
     * The name of the check
     */
    readonly name: string;
    /**
     * The function validating the check
     */
    callback: CheckFunc;
    /**
     * The description of the check
     */
    description: string;
    /**
     * Property that determines whether a check should be called before every command
     */
    global: boolean;
    /**
     * The cog that the check is in
     */
    cog: Cog | null;
    /**
     * @param name name of the check
     * @param func function validating the check
     * @param data additional check options
     * @example new Check("longMessage", (ctx, args) => ctx.message.content > 50, {})
     */
    constructor(name: string, func: CheckFunc, data: CheckData);
}
