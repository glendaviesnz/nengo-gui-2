/**
 * Shows an image or pixel grid over time.
 *
 * @constructor
 * @param {DOMElement} parent - the element to add this component to
 * @param {SimControl} sim - the simulation controller
 * @param {dict} args - A set of constructor arguments (see Component)
 * @param {int} args.n_lines - number of decoded values
 * @param {float} args.miny - minimum value on y-axis
 * @param {float} args.maxy - maximum value on y-axis
 */

import * as d3 from "d3";

import { DataStore } from "../datastore";
import { Plot } from "./plot";
import { Position } from "./position";
import { registerComponent } from "./registry";
import { Connection } from "../server";
import { ValueView } from "./value";

export class Image extends Plot {
    canvas;
    dataStore: DataStore;
    displayTime;
    image;
    nPixels: number;
    pixelsX: number;
    pixelsY: number;
    svg;
    view: ValueView;

    constructor({
        server,
        uid,
        label,
        pos,
        dimensions,
        synapse,
        labelVisible = true,
        xlim = [-0.5, 0],
        ylim = [-1, 1]
    }: {
        server: Connection;
        uid: string;
        label: string,
        pos: Position;
        dimensions: number;
        synapse: number;
        labelVisible?: boolean;
        xlim?: [number, number];
        ylim?: [number, number];
    }) {
        super(
            server,
            uid,
            new ValueView(),
            label,
            pos,
            dimensions,
            synapse,
            labelVisible,
            xlim,
            ylim
        );

        // this.displayTime = displayTime;
        this.pixelsX = xlim[1];
        this.pixelsY = ylim[1];
        this.nPixels = this.pixelsX * this.pixelsY;

        // For storing the accumulated data
        this.dataStore = new DataStore(this.nPixels, 0);

        // Draw the plot as an SVG
        this.svg = d3
            .select("this.div")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("style", ["padding-top:", "2em"].join(""));

        // Call schedule_update whenever the time is adjusted in the SimControl
        window.addEventListener("TimeSlider.moveShown", e => {
            // this.scheduleUpdate();
        });

        // Create the image
        this.image = this.svg
            .append("image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr(
                "style",
                [
                    "image-rendering: -webkit-optimize-contrast;",
                    "image-rendering: -moz-crisp-edges;",
                    "image-rendering: pixelated;"
                ].join("")
            );

        this.canvas = document.createElement("CANVAS");
        this.canvas.width = this.pixelsX;
        this.canvas.height = this.pixelsY;
    }

    /**
     * Receive new line data from the server
     */
    onMessage(event) {
        let data = new Uint8Array(event.data);
        const msgSize = this.nPixels + 4;

        for (let i = 0; i < data.length; i += msgSize) {
            const timeData = new Float32Array(event.data.slice(i, i + 4));
            data = Array.prototype.slice.call(data, i + 3, i + msgSize);
            data[0] = timeData[0];
            this.dataStore.add(Array.prototype.slice.call(data));
        }
        // this.scheduleUpdate();
    }

    /**
     * Redraw the lines and axis due to changed data
     */
    update() {
        // Let the data store clear out old values
        // this.dataStore.update();
        // const data = this.dataStore.getLastData();
        // const ctx = this.canvas.getContext("2d");
        // const imgData = ctx.getImageData(0, 0, this.pixelsX, this.pixelsY);
        // for (let i = 0; i < this.nPixels; i++) {
        //     imgData.data[4 * i + 0] = data[i];
        //     imgData.data[4 * i + 1] = data[i];
        //     imgData.data[4 * i + 2] = data[i];
        //     imgData.data[4 * i + 3] = 255;
        // }
        // ctx.putImageData(imgData, 0, 0);
        // const dataURL = this.canvas.toDataURL("image/png");
        // this.image.attr("xlink:href", dataURL);
    }

    /**
     * Adjust the graph layout due to changed size
     */
    onresize(width, height) {
        // if (width < this.minWidth) {
        //     width = this.minWidth;
        // }
        // if (height < this.minHeight) {
        //     height = this.minHeight;
        // }

        this.svg.attr("width", width).attr("height", height);

        this.update();

        // this.label.style.width = width;

        // this.width = width;
        // this.height = height;
        // this.div.style.width = width;
        // this.div.style.height = height;
    }
}

registerComponent("spike_grid", Image);
