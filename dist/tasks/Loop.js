"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loop = void 0;
const events_1 = __importDefault(require("events"));
class Loop extends events_1.default {
    constructor(options) {
        var _a, _b;
        super();
        this.currentIteration = 0;
        this.count = (_a = options.count) !== null && _a !== void 0 ? _a : Infinity;
        if (this.count <= 0)
            throw new Error("Count cannot be lower then 1");
        this.stopOnFail = (_b = options.stopOnFail) !== null && _b !== void 0 ? _b : false;
        this._stop = false;
        this._canceled = false;
        if (!options.hours && !options.minutes && !options.seconds && !options.milliseconds)
            throw new Error("Time cannot be 0");
        this.ms = Loop.parseTime(options);
        this.timeout = null;
        this.callback = options.func;
    }
    /**
     * Parses Time object to the number of milliseconds
     * @param t The Time object that should be converted
     * @returns milliseconds that were calculated
     */
    static parseTime(t) {
        var _a;
        let ms = 0;
        ms += t.hours ? t.hours * 3600000 : 0;
        ms += t.minutes ? t.minutes * 60000 : 0;
        ms += t.seconds ? t.seconds * 1000 : 0;
        ms += (_a = t.milliseconds) !== null && _a !== void 0 ? _a : 0;
        return ms;
    }
    _runner(...args) {
        try {
            this.callback(...args);
        }
        catch (err) {
            this.emit("error", err);
            if (this.stopOnFail) {
                this.timeout = null;
                return;
            }
        }
        this.currentIteration++;
        if (this.count - this.currentIteration <= 0)
            return this.emit("after");
        if (this._stop) {
            this.timeout = null;
            this.emit("after");
            return;
        }
        this.timeout = setTimeout(this._runner.bind(this), this.ms, ...args);
    }
    /**
     * Number of milliseconds left to the next iteration
     */
    get nextIteration() {
        if (!this.timeout)
            return -1;
        const t = this.timeout;
        const ms = t._idleTimeout - (Math.floor(process.uptime() * 1000) - t._idleStart);
        return ms < 0 ? -1 : ms;
    }
    /**
     * Starts the loop
     * @param args the arguments to use
     * @returns the Loop
     */
    start(...args) {
        this.emit("before");
        this._stop = false;
        this.currentIteration = 0;
        this._runner(...args);
        return this;
    }
    /**
     * Gracefully stops the task from running. Unlike cancel(), this allows the task to finish its current iteration before gracefully exiting
     * @returns the Loop
     */
    stop() {
        this._stop = true;
        return this;
    }
    /**
     * A convenience method to restart the loop
     * @param args the arguments to use
     * @returns the Loop
     */
    restart(...args) {
        this.cancel();
        this.start(...args);
        return this;
    }
    /**
     * Cancels the internal task if it is running
     * @returns the loop
     */
    cancel() {
        if (!this.timeout)
            return;
        this._canceled = true;
        this.emit("after");
        clearTimeout(this.timeout);
        this.timeout = null;
        this._canceled = false;
        return this;
    }
    /**
     * Changes the interval for the sleep time
     * @param newInterval the new interval either number of milliseconds or a Time object
     * @returns new interval in milliseconds
     */
    changeInterval(newInterval) {
        if (typeof newInterval !== "number" && !newInterval.hours && !newInterval.minutes && !newInterval.seconds && !newInterval.milliseconds)
            throw new Error("Time cannot be 0");
        this.ms = typeof newInterval === "number" ?
            newInterval : Loop.parseTime(newInterval);
        return this.ms;
    }
    /**
     * Whether the loop is being cancelled
     * @returns boolean indicating whether the loop is being cancelled
     */
    isBeingCanceled() {
        return this._canceled;
    }
    /**
     * Whether the loop is running
     * @returns boolean indicating whether the loop is running
     */
    isRunning() {
        return Boolean(this.timeout);
    }
}
exports.Loop = Loop;
