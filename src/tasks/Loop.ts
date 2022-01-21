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
    callOnStart?: boolean,
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

export class Loop extends EventEmitter {
    currentIteration: number
    count: number
    callOnStart: boolean
    stopOnFail: boolean

    private _stop: boolean
    private ms: number
    private timeout: NodeJS.Timeout | null
    private callback: (...args: any[]) => any

    constructor(options: LoopOptions) {
        super()

        this.currentIteration = 0
        this.count = options.count ?? Infinity
        this.callOnStart = options.callOnStart ?? false
        this.stopOnFail = options.stopOnFail ?? false

        this._stop = false
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
            // if (!this.callOnStart && this.currentIteration === 0)
            this.callback(...args)
        } catch (err) {
            this.emit("error", err)
            if (this.stopOnFail) {
                this.timeout = null
                return
            }
        }

        this.timeout = this._stop ? null : setTimeout(this._runner.bind(this), this.ms, ...args)
    }

    get nextIteration() {
        return 0
    }

    start(...args: any[]) {
        this._stop = false
        this._runner(...args)
    }

    stop() {
        this._stop = true
    }

    restart(...args: any[]) {

    }

    cancel() {
        if (!this.timeout) return
        clearTimeout(this.timeout)
        this.timeout = null
    }

    changeInterval(newInterval: Time | number) {
        this.ms = typeof newInterval === "number" ?
            newInterval : this._parseTime(newInterval)
        return this.ms
    }

    isBeingCanceled() {

    }

    isRunning() {
        return Boolean(this.timeout)
    }
}
