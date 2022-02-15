"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Check = void 0;
/**
 * This class represents a check. Do not use this to create a check instead use for example `Bot.addCheck`
 */
class Check {
    /**
     * @param name name of the check
     * @param func function validating the check
     * @param data additional check options
     * @example new Check("longMessage", (ctx, args) => ctx.message.content > 50, {})
     */
    constructor(name, func, data) {
        var _a, _b, _c;
        this.name = name;
        this.callback = func;
        this.description = (_a = data.description) !== null && _a !== void 0 ? _a : "";
        this.global = (_b = data.global) !== null && _b !== void 0 ? _b : false;
        this.cog = (_c = data.cog) !== null && _c !== void 0 ? _c : null;
    }
}
exports.Check = Check;
