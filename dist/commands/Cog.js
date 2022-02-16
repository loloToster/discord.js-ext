"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cog = void 0;
const Check_1 = require("./Check");
const Command_1 = require("./Command");
/**
 * A cog is a collection of commands, listeners etc. to help group commands together.
 */
class Cog {
    /**
     * @param data object containing raw cog data
     */
    constructor(data) {
        var _a, _b, _c, _d;
        this.name = data.name;
        this.description = (_a = data.description) !== null && _a !== void 0 ? _a : "";
        this._checks = [];
        this._commands = [];
        this._listeners = [];
        for (const key in data) {
            const element = data[key];
            if (typeof element === "string" ||
                typeof element === "undefined" ||
                typeof element === "function")
                continue;
            if (Cog._isRawCheck(element))
                this._checks.push(new Check_1.Check((_b = element.name) !== null && _b !== void 0 ? _b : key, element.check, {
                    description: element.description,
                    global: element.global,
                    cog: this
                }));
            else if (Cog._isRawCommand(element))
                this._commands.push(new Command_1.Command((_c = element.name) !== null && _c !== void 0 ? _c : key, element.command, {
                    description: element.description,
                    aliases: element.aliases,
                    usage: element.usage,
                    check: element.check,
                    cog: this
                }));
            else if (Cog._isListener(element)) {
                let event = (_d = element.event) !== null && _d !== void 0 ? _d : key;
                element.event = event;
                this._listeners.push(element);
            }
        }
    }
    static _isRawCheck(obj) {
        return typeof obj.check === "function";
    }
    /**
     * List of cog's checks 🚨 readonly
     */
    get checks() {
        return this._checks;
    }
    set checks(_) { throw new Error("Cannot set checks property"); }
    static _isRawCommand(obj) {
        return typeof obj.command === "function";
    }
    /**
     * List of cog's commands 🚨 readonly
     */
    get commands() {
        return this._commands;
    }
    set commands(_) { throw new Error("Cannot set commands property"); }
    static _isListener(obj) {
        return typeof obj.on === "function" || typeof obj.once === "function";
    }
    /**
     * List of cog's listeners 🚨 readonly
     */
    get listeners() {
        return this._listeners;
    }
    set listeners(_) { throw new Error("Cannot set listeners property"); }
}
exports.Cog = Cog;
