'use client';

import { createElement, createRef, use, useEffect, useRef, useState } from "react";

/*
    This is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Set up audio context
// (window as any).AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
// const audioContext = new AudioContext();

/**
 * Filters the AudioBuffer retrieved from an external source
 * @param {AudioBuffer} audioBuffer the AudioBuffer from drawAudio()
 * @returns {Array} an array of floating point numbers
 */
const filterData = (audioBuffer: AudioBuffer): Array<any> => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const sampleSize = 500; // the size of the sample we average by (in milliseconds)
  const rawDuration = audioBuffer.duration * 1000; // duration of the audio in milliseconds
  const samples = Math.floor(rawDuration / sampleSize) // 70; // Number of samples we want to have in our final data set
  console.log(`Raw data length: ${rawData.length}; Rate: ${audioBuffer.sampleRate} Hz; Duration: ${rawDuration} s; Samples: ${samples}`);
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
  }
  return filteredData;
};

/**
 * Normalizes the audio data to make a cleaner illustration 
 * @param {Array} filteredData the data from filterData()
 * @returns {Array} an normalized array of floating point numbers
 */
const normalizeData = (filteredData: Array<any>): Array<any> => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
}

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

const promiseLog = (data: any, message: string): Promise<any> => {
  console.log(message);
  return Promise.resolve(data);
}

interface AmplitudeCanvasProps {
  // not used? audioContext: AudioContext
  audioUrl: string | null
  onFilteredData: (filteredData: Array<number>) => void
}

// export default function AmplitudeCanvas(props: AmplitudeCanvasProps): JSX.Element {
//   const [calculating, setCalculating] = useState(true);
//   useEffect(() => {
//     setCalculating(true);
//   }, [props.audioUrl]);
//   const canvasRef = createRef<HTMLCanvasElement>();

//   useEffect(() => {  
//     if (canvasRef.current) {
//       console.log("Canvas ref exists");
//       const canvas = canvasRef.current;
//       const canvasContext = canvas.getContext('2d');
//       if (canvasContext) {
//         const width = canvas.width;
//         const height = canvas.height;
//         canvasContext.clearRect(0, 0, width, height);
//       } else {
//         console.log("No canvas context");
//       }
//       if (props.audioUrl) {
//         const audioContext = new AudioContext();
//         fetch(props.audioUrl)
//           .then(response => response.arrayBuffer())
//           .then(input => promiseLog(input, "Got audio buffer"))
//           .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
//           .then(input => promiseLog(input, "Decoded audio buffer"))
//           .then(audioBuffer => {if (canvas) {draw(canvas, normalizeData(filterData(audioBuffer)))}})
//           .then(input => promiseLog(input, "Canvas drawn"))
//           .then(() => setCalculating(false));
//       } else {
//         console.log("No audio URL provided");
//       };
//     } else {
//       console.log("No canvas ref");
//     }
//   }, [canvasRef, props.audioUrl]);

//   console.log("AmplitudeCanvas rendering");

//   return (
//     <>
//       {calculating ? (
//         <div>Visualizing audio amplitude please wait...</div>
//       ) : (
//         <canvas id="amplitude-canvas" ref={canvasRef} />
//       )}
//     </>
//   );
// }

export default function AmplitudeCanvas(props: AmplitudeCanvasProps): JSX.Element {
  const [calculating, setCalculating] = useState(true);
  const [haveUrl, setHaveUrl] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setCalculating(true);
    console.log(`In useEffect, AudioUrl: ${props.audioUrl}`);
    if (props.audioUrl) {
      if (props.audioUrl !== audioUrl) {
        console.log(`Setting audio URL to ${props.audioUrl}`);
        setAudioUrl(props.audioUrl);
      }
      setHaveUrl(props.audioUrl.length > 0);
    } else { 
      console.log("No audio URL in useEffect");
    }
  }, [audioUrl, props.audioUrl]);

  console.log(`AudioUrl: ${props.audioUrl}`);
  let canvas: HTMLCanvasElement | null = null;
  let canvasContext: CanvasRenderingContext2D | null | undefined = null;
  
  console.log("AmplitudeCanvas rendering");
  if (canvas && canvasContext) { // TODO: This is always false?
    const width = (canvas as HTMLCanvasElement).width;
    const height = (canvas as HTMLCanvasElement).height;
    console.log(`Canvas width: ${width}, height: ${height}`);
    (canvasContext as CanvasRenderingContext2D).clearRect(0, 0, width, height);
  } else {
    console.log("No canvas or canvas context");
  }
  if (props.audioUrl) {
    const audioContext = new AudioContext();
    fetch(props.audioUrl)
      .then(response => response.arrayBuffer())
      .then(input => promiseLog(input, "Got audio buffer"))
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(input => promiseLog(input, "Decoded audio buffer"))
      .then(audioBuffer => new Promise((resolve, reject) => {
        const filteredData = filterData(audioBuffer);
        if (props.onFilteredData) {
          props.onFilteredData(filteredData);
        } else {
          console.log("No onFilteredData callback");
        }
        const normalizedData = normalizeData(filteredData);
        if (canvas) {
          draw(canvas, normalizedData)
        }
        resolve(normalizedData);
      }))
      .then(input => promiseLog(input, "Canvas drawn"))
      .then(() => setCalculating(false));
  };

  return (
    <>
      {haveUrl ? calculating && (
        <div>Visualizing audio amplitude please wait...</div>
      ) : (
        <div>Please select an audio file to begin</div>
      )}
      <div>
        <canvas id="amplitude-canvas" className="w-full flex flex-col flex-grow"
          ref={(c) => { canvas = c ; canvasContext = c?.getContext('2d')}} />
      </div>
   </>
  );
}