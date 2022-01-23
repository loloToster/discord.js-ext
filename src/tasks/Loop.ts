import EventEmitter from "events"

export interface Time {
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number
}

export interface LoopOptions extends Time {
    /**
     * The function executed to be executed on each iteration
     */
    func: (...args: any[]) => any,
    /**
     * The number of loops to do, undefined if it should be an infinite loop
     */
    count?: number,
    /**
     * Parameter indicating whether to stop the loop when it throws an error
     */
    stopOnFail?: boolean
}

export interface LoopEvents {
    error: [err: unknown],
    before: [],
    after: []
}

export interface Loop {
    on<K extends keyof LoopEvents>(event: K, listener: (...args: LoopEvents[K]) => any): this,
    emit<K extends keyof LoopEvents>(event: K, ...args: LoopEvents[K]): boolean
}

interface _Timeout extends NodeJS.Timeout {
    _idleTimeout: number,
    _idleStart: number
}

export class Loop extends EventEmitter {
    /**
     * The current iteration of the loop
     */
    currentIteration: number
    readonly count: number
    stopOnFail: boolean

    private _stop: boolean
    private _canceled: boolean
    private ms: number
    private timeout: NodeJS.Timeout | null
    private callback: (...args: any[]) => any

    constructor(options: LoopOptions) {
        super()

        this.currentIteration = 0
        this.count = options.count ?? Infinity
        if (this.count <= 0) throw new Error("Count cannot be lower then 1")
        this.stopOnFail = options.stopOnFail ?? false

        this._stop = false
        this._canceled = false
        if (!options.hours && !options.minutes && !options.seconds && !options.milliseconds)
            throw new Error("Time cannot be 0")
        this.ms = Loop.parseTime(options)
        this.timeout = null
        this.callback = options.func
    }

    /**
     * Parses Time object to the number of milliseconds
     * @param t The Time object that should be converted
     * @returns milliseconds that were calculated
     */
    static parseTime(t: Time) {
        let ms = 0
        ms += t.hours ? t.hours * 3600000 : 0
        ms += t.minutes ? t.minutes * 60000 : 0
        ms += t.seconds ? t.seconds * 1000 : 0
        ms += t.milliseconds ?? 0

        return ms
    }

    private _runner(...args: any[]) {
        try {
            this.callback(...args)
        } catch (err) {
            this.emit("error", err)
            if (this.stopOnFail) {
                this.timeout = null
                return
            }
        }

        this.currentIteration++
        if (this.count - this.currentIteration <= 0)
            return this.emit("after")

        if (this._stop) {
            this.timeout = null
            this.emit("after")
            return
        }

        this.timeout = setTimeout(this._runner.bind(this), this.ms, ...args)
    }

    /**
     * Number of milliseconds left to the next iteration
     */
    get nextIteration() {
        if (!this.timeout) return -1
        const t = this.timeout as _Timeout
        const ms = t._idleTimeout - (Math.floor(process.uptime() * 1000) - t._idleStart)
        return ms < 0 ? -1 : ms
    }

    /**
     * Starts the loop
     * @param args the arguments to use
     * @returns the Loop
     */
    start(...args: any[]) {
        this.emit("before")
        this._stop = false
        this.currentIteration = 0
        this._runner(...args)
        return this
    }

    /**
     * Gracefully stops the task from running. Unlike cancel(), this allows the task to finish its current iteration before gracefully exiting
     * @returns the Loop
     */
    stop() {
        this._stop = true
        return this
    }

    /**
     * A convenience method to restart the loop 
     * @param args the arguments to use
     * @returns the Loop
     */
    restart(...args: any[]) {
        this.cancel()
        this.start(...args)
        return this
    }

    /**
     * Cancels the internal task if it is running
     * @returns the loop
     */
    cancel() {
        if (!this.timeout) return
        this._canceled = true
        this.emit("after")
        clearTimeout(this.timeout)
        this.timeout = null
        this._canceled = false
        return this
    }

    /**
     * Changes the interval for the sleep time
     * @param newInterval the new interval either number of milliseconds or a Time object
     * @returns new interval in milliseconds
     */
    changeInterval(newInterval: Time | number) {
        if (typeof newInterval !== "number" && !newInterval.hours && !newInterval.minutes && !newInterval.seconds && !newInterval.milliseconds)
            throw new Error("Time cannot be 0")

        this.ms = typeof newInterval === "number" ?
            newInterval : Loop.parseTime(newInterval)

        return this.ms
    }

    /**
     * Whether the loop is being cancelled
     * @returns boolean indicating whether the loop is being cancelled
     */
    isBeingCanceled() {
        return this._canceled
    }

    /**
     * Whether the loop is running
     * @returns boolean indicating whether the loop is running
     */
    isRunning() {
        return Boolean(this.timeout)
    }
}
