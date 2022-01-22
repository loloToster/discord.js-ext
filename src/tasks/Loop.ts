import EventEmitter from "events"

export interface Time {
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number
}

export interface LoopOptions extends Time {
    func: (...args: any[]) => any,
    count?: number,
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
        this.ms = this._parseTime(options)
        this.timeout = null
        this.callback = options.func
    }

    _parseTime(t: Time) {
        if (!t.hours && !t.minutes && !t.seconds && !t.milliseconds)
            throw new Error("Time cannot be 0")

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

    get nextIteration() {
        if (!this.timeout) return -1
        const t = this.timeout as _Timeout
        const ms = t._idleTimeout - (Math.floor(process.uptime() * 1000) - t._idleStart)
        return ms < 0 ? -1 : ms
    }

    start(...args: any[]) {
        this.emit("before")
        this._stop = false
        this.currentIteration = 0
        this._runner(...args)
        return this
    }

    stop() {
        this._stop = true
        return this
    }

    restart(...args: any[]) {
        this.cancel()
        this.start(...args)
        return this
    }

    cancel() {
        if (!this.timeout) return
        this._canceled = true
        this.emit("after")
        clearTimeout(this.timeout)
        this.timeout = null
        this._canceled = false
        return this
    }

    changeInterval(newInterval: Time | number) {
        this.ms = typeof newInterval === "number" ?
            newInterval : this._parseTime(newInterval)
        return this.ms
    }

    isBeingCanceled() {
        return this._canceled
    }

    isRunning() {
        return Boolean(this.timeout)
    }
}
