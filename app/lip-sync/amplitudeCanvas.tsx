'use client';

import { createElement, createRef, use, useEffect, useRef, useState } from "react";
import { normalizeData } from "../utils/audio-functions";

/**
 * Draws the audio file into a canvas element.
 * @param {HTMLCanvasElement} canvas the canvas element
 * @param {Array} normalizedData The filtered array returned from filterData()
 * @returns {Array} a normalized array of data
 */
const draw = (canvas: HTMLCanvasElement, normalizedData: Array<any>) => {
  const dpr = window.devicePixelRatio || 1;
  const padding = 20;
  console.log(`Canvas offset width: ${canvas.offsetWidth}, height: ${canvas.offsetHeight}`);
  if (canvas) {
    console.log(`BEFORE Canvas width: ${canvas.width}, height: ${canvas.height}`);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
    console.log(`Canvas width: ${canvas.width}, height: ${canvas.height}`);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.translate(0, canvas.offsetHeight / 2 + padding); // set Y = 0 to be in the middle of the canvas

      // draw the line segments
      const width = canvas.offsetWidth / normalizedData.length;
      for (let i = 0; i < normalizedData.length; i++) {
        const x = width * i;
        let height: number = normalizedData[i] * canvas.offsetHeight - padding;
        if (height < 0) {
            height = 0;
        } else if (height > canvas.offsetHeight / 2) {
            height = canvas.offsetHeight / 2;
        }
        drawLineSegment(ctx, x, height, width, ((i + 1) % 2) == 0);
      }
    }
  }
};

/**
 * A utility function for drawing our line segments
 * @param {CanvasRenderingContext2D} ctx the audio context 
 * @param {number} x  the x coordinate of the beginning of the line segment
 * @param {number} height the desired height of the line segment
 * @param {number} width the desired width of the line segment
 * @param {boolean} isEven whether or not the segmented is even-numbered
 */
const drawLineSegment = (ctx: CanvasRenderingContext2D, x: number, height: number, width: number, isEven: boolean) => {
  ctx.lineWidth = 1; // how thick the line is
  ctx.strokeStyle = "#FF0066"; // what color our line is
  ctx.beginPath();
  height = isEven ? height : -height;
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.arc(x + width / 2, height, width / 2, Math.PI, 0, isEven);
  ctx.lineTo(x + width, 0);
  ctx.stroke();
};

interface AmplitudeCanvasProps {
  filterData: Array<number>;
}

export default function AmplitudeCanvas(props: AmplitudeCanvasProps): JSX.Element {
  const [filteredData, setFilteredData] = useState<Array<number>>(props.filterData);
  let canvas: HTMLCanvasElement | null = null;
  let canvasContext: CanvasRenderingContext2D | null | undefined = null;

  useEffect(() => {
    if (props.filterData && props.filterData.length > 0) {
      setFilteredData(props.filterData);
      if (canvas) {
        draw(canvas as HTMLCanvasElement, normalizeData(props.filterData));
      } else {
        throw new Error("Canvas element not set");
      }
    }
  }, [props.filterData, canvas]);
  const haveData = props.filterData ? props.filterData.length > 0 : false;

  
  console.log("AmplitudeCanvas rendering");
  if (canvas && canvasContext) {
    console.log("ADAM: IT WAS SET"); // TODO: This is always false?
    console.log("Clearing canvas");
    const width = (canvas as HTMLCanvasElement).width;
    const height = (canvas as HTMLCanvasElement).height;
    console.log(`Canvas width: ${width}, height: ${height}`);
    (canvasContext as CanvasRenderingContext2D).clearRect(0, 0, width, height);
  } else {
    console.log("No canvas or canvas context");
  }
  return haveData ? (
    <div>
      <canvas id="amplitude-canvas" className="w-full flex flex-col flex-grow"
        ref={(c) => { canvas = c ; canvasContext = c?.getContext('2d')}} />
    </div>
  ) : (
    <div>Visualization will be loaded after file is selected and processed (this can take a bit, please be patient...)</div>
  );
}