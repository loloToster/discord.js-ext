export interface Time {
    hours?: number,
    minutes?: number,
    seconds?: number
}

export interface LoopOptions extends Time {
    count?: number
}

export class Loop {
    currentIteration: number

    constructor(options: LoopOptions = {}) {
        this.currentIteration = 0


    }

    get nextIteration() {
        return 0
    }

    start(...args: any[]) {

    }

    stop() {

    }

    restart(...args: any[]) {

    }

    after(func: Function) {

    }

    before(func: Function) {

    }

    cancel() {

    }

    changeInterval(newInterval: number) {

    }

    error(func: Function) {

    }

    isBeingCanceled() {

    }

    isRunning() {

    }
}
