import * as utils from "./utils";

export type TypedArray =
    | Uint8Array
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;

/**
 * Storage of a set of data points and associated times with a fixed
 * number of dimensions.
 *
 * @constructor
 * @param {int} dims - number of data points per time
 * @param {SimControl} sim - the simulation controller
 * @param {float} synapse - the filter to apply to the data
 */
export class DataStore {
    data: number[][] = [];
    times: number[] = [];
    synapse: number;

    protected _dims: number;

    constructor(dims: number, synapse: number) {
        this._dims = dims;
        this.synapse = synapse; // TODO: get from SimControl

        // Listen for updates to the TimeSlider
        window.addEventListener(
            "TimeSlider.addTime",
            utils.throttle((event: CustomEvent) => {
                // How much has the most recent time exceeded how much is kept?
                const limit = event.detail.timeCurrent - event.detail.keptTime;
                const extra = DataStore.nearestIndex(this.times, limit);

                // Remove the extra data
                if (extra > 0) {
                    this.remove(0, extra);
                }
            }, 200) // Only update once per 200 ms
        );
    }

    get dims(): number {
        return this._dims;
    }

    set dims(val: number) {
        const newDims = val - this._dims;

        if (newDims > 0) {
            const nulls = utils.emptyArray(newDims).map(() => null);
            this.data = this.data.map(row => row.concat(nulls));
        } else if (newDims < 0) {
            console.warn(`Removed ${Math.abs(newDims)} dimension(s).`);
            // + 2 because time is dim 0, and end is not included
            this.data = this.data.map(row => row.slice(0, val + 2));
        }
        this._dims = val;
    }

    get length(): number {
        return this.data.length;
    }

    /**
     * Returns the index in `array` at `element`, or before it.
     *
     * This is helpful for determining where to insert an element,
     * and for finding indices between two elements.
     *
     * This method uses binary search to be much faster than the naive
     * approach of iterating through the array in order.
     * Note that this assumes that the array is sorted, but that is also true
     * if you were to search through it linearly.
     *
     * Returns 0 if element is less than all elements in array.
     */
    static nearestIndex(array: number[], element: number) {
        let [low, high] = [0, array.length];

        while (high > low) {
            // Note: | 0 is a faster Math.floor
            const ix = ((high + low) / 2) | 0;

            if (array[ix] <= element) {
                if (array[ix + 1] > element || ix + 1 === array.length) {
                    return ix;
                } else {
                    low = ix + 1;
                }
            } else {
                high = ix;
            }
        }
        console.assert(low === 0 && high === 0);
        return 0;
    }

    /**
     * Add a row of data.
     *
     * @param {array} row - dims+1 data points, with time as the first one
     */
    add(row: number[] | TypedArray) {
        console.assert(row.length - 1 === this.dims);
        const time = row[0];
        // If we get data out of order, wipe out the later data
        if (time < this.times[this.times.length - 1]) {
            this.remove(DataStore.nearestIndex(this.times, time));
        }

        // Compute lowpass filter (value = value*decay + newValue*(1-decay)
        let decay = 0.0;
        if (this.times.length > 0 && this.synapse > 0) {
            const dt = time - this.times[this.times.length - 1];
            decay = Math.exp(-dt / this.synapse);
        }

        // Filter new data
        const newdata = [time];
        const lastdata = this.data[this.data.length - 1];
        for (let i = 1; i < row.length; i++) {
            if (lastdata == null || lastdata[i] == null || decay <= 0.0) {
                newdata.push(row[i]);
            } else {
                newdata.push(row[i] * (1 - decay) + lastdata[i] * decay);
            }
        }

        this.data.push(newdata);
        // Also keep a separate times list (for fast lookups)
        this.times.push(time);
    }

    at(time: number) {
        return this.data[DataStore.nearestIndex(this.times, time)];
    }

    /**
     * Reset the data storage.
     *
     * This will clear current data so there is
     * nothing to display on a reset event.
     */
    reset() {
        this.remove(0);
    }

    remove(start: number, deleteCount?: number) {
        // TODO: try to remove this weird if statement
        if (deleteCount == null) {
            this.data.splice(start);
            this.times.splice(start);
        } else {
            this.data.splice(start, deleteCount);
            this.times.splice(start, deleteCount);
        }
    }

    slice(beginIndex: number, endIndex?: number) {
        if (endIndex == null) {
            return this.data.slice(beginIndex);
        } else {
            return this.data.slice(beginIndex, endIndex);
        }
    }

    timeSlice(beginTime: number, endTime?: number) {
        const beginIndex = DataStore.nearestIndex(this.times, beginTime);
        const endIndex = endTime
            ? DataStore.nearestIndex(this.times, endTime) + 1
            : undefined;
        return this.slice(beginIndex, endIndex);
    }
}
