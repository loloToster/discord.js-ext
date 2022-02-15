/// <reference types="node" />
import EventEmitter from "events";
export interface Time {
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}
export interface LoopOptions extends Time {
    /**
     * The function executed to be executed on each iteration
     */
    func: (...args: any[]) => any;
    /**
     * The number of loops to do, undefined if it should be an infinite loop
     */
    count?: number;
    /**
     * Parameter indicating whether to stop the loop when it throws an error
     */
    stopOnFail?: boolean;
}
export interface LoopEvents {
    error: [err: unknown];
    before: [];
    after: [];
}
export interface Loop {
    on<K extends keyof LoopEvents>(event: K, listener: (...args: LoopEvents[K]) => any): this;
    emit<K extends keyof LoopEvents>(event: K, ...args: LoopEvents[K]): boolean;
}
export declare class Loop extends EventEmitter {
    /**
     * The current iteration of the loop
     */
    currentIteration: number;
    readonly count: number;
    stopOnFail: boolean;
    private _stop;
    private _canceled;
    private ms;
    private timeout;
    private callback;
    constructor(options: LoopOptions);
    /**
     * Parses Time object to the number of milliseconds
     * @param t The Time object that should be converted
     * @returns milliseconds that were calculated
     */
    static parseTime(t: Time): number;
    private _runner;
    /**
     * Number of milliseconds left to the next iteration
     */
    get nextIteration(): number;
    /**
     * Starts the loop
     * @param args the arguments to use
     * @returns the Loop
     */
    start(...args: any[]): this;
    /**
     * Gracefully stops the task from running. Unlike cancel(), this allows the task to finish its current iteration before gracefully exiting
     * @returns the Loop
     */
    stop(): this;
    /**
     * A convenience method to restart the loop
     * @param args the arguments to use
     * @returns the Loop
     */
    restart(...args: any[]): this;
    /**
     * Cancels the internal task if it is running
     * @returns the loop
     */
    cancel(): this | undefined;
    /**
     * Changes the interval for the sleep time
     * @param newInterval the new interval either number of milliseconds or a Time object
     * @returns new interval in milliseconds
     */
    changeInterval(newInterval: Time | number): number;
    /**
     * Whether the loop is being cancelled
     * @returns boolean indicating whether the loop is being cancelled
     */
    isBeingCanceled(): boolean;
    /**
     * Whether the loop is running
     * @returns boolean indicating whether the loop is running
     */
    isRunning(): boolean;
}
