"use client";

import { useContext, useEffect, useState } from "react";
import AmplitudeCanvas from "./amplitudeCanvas";
import SerialContext from "../contexts/serial";
import { SimpleEvent } from "../types";
import { useInterval } from "react-use";
import WebSerialConditional from "../components/webserial-conditional";

interface ServoControlsProps {
  filteredData: Array<number>;
  audioSrc: string | null;
  audioPlay: () => Promise<void>;
  audioSeek: (time: number) => void;
}

export default function ServoControls(props: ServoControlsProps): JSX.Element {
  const [channel, setChannel] = useState<number>(-1);
  const [minPulse, setMinPulse] = useState<number>(0);
  const [maxPulse, setMaxPulse] = useState<number>(2500);
  const [pulseWidth, setPulseWidth] = useState<number>(1000);
  const [servoSequence, setServoSequence] = useState<Array<SimpleEvent>>([]);
  const [servoPlaybackOffset, setServoPlaybackOffset] = useState<number>(-1);
  const serialContext = useContext(SerialContext);

  useEffect(() => {
    console.log("ServoControls re-rendering servo sequence");
    if (!props.filteredData || props.filteredData.length === 0) {
      console.log("ServoControls filteredData is empty");
      setServoSequence([]);
    } else {
      const servoSequence: Array<SimpleEvent> = [];
      let time = 0;
      let countOverMin = 0;
      const servoRange = maxPulse - minPulse;
      for (let i = 0; i < props.filteredData.length; i++) {
        const pulseWidth = Math.floor((props.filteredData[i] * servoRange) + minPulse);
        (pulseWidth > minPulse) && countOverMin++;
        time = i * 500; // alternative: time += 500; // Each sample is 500ms (see filterData in audio-functions.ts)
        servoSequence.push({ pulseWidth, sinceStart: time });
      }
      setServoSequence(servoSequence);
      console.log(`ServoControls DONE re-rendering servo sequence. There are ${servoSequence.length} events of which ${countOverMin} are over minimum.`);
    }
  }, [maxPulse, minPulse, props.filteredData]);

  useInterval(
    () => {
      const index = servoPlaybackOffset;
      const pulseWidth = servoSequence[index].pulseWidth;
      const sinceStart = servoSequence[index].sinceStart;
      console.log(`Playing servo event ${index} at ${sinceStart}ms with pulse width ${pulseWidth}ms`);
      // Send the servo changes to the servo controller
      const serialMessage = `#${channel}P${pulseWidth}\r`;
      try {
        const enc = new TextEncoder(); // always utf-8
        serialContext.writer?.write(enc.encode(serialMessage));
        console.log(`Sent serial message: ${serialMessage}`);
      } catch (e) {
        throw new Error(`Failed to send serial message (${serialMessage}): ${e}`);
      }
    },
    servoPlaybackOffset === -1 ? null : 500 // set interval to 500ms if we have a servoPlaybackOffset
  );
  
  return (
    <WebSerialConditional getStartedMessage="to play this lip sync on a servo.">
      <div className="flex">
        <div>
          <input type="range" id="channel" min="-1" max="31" value={channel} onChange={(e) => setChannel(Number(e.target.value))} step="1" />
          <label htmlFor="channel">Channel {channel} </label>
        </div>
        <div>
          <input type="range" id="min-position" min="0" max={maxPulse - 1} value={minPulse} onChange={(e) => setMinPulse(Number(e.target.value))} disabled={channel == -1}/>
          <label htmlFor="min-position">Min {minPulse}ms</label>
        </div>
        <div>
          <input type="range" id="max-position" min={minPulse + 1} max="2000" value={maxPulse} onChange={(e) => setMaxPulse(Number(e.target.value))} disabled={channel == -1}/>
          <label htmlFor="max-position">Max {maxPulse}ms</label>
        </div>
        <div>
          <input type="range" id="servo-position" min={minPulse} max={maxPulse} value={pulseWidth} step="1" onChange={(e) => setPulseWidth(Number(e.target.value))}  disabled={channel == -1}/>
          <label htmlFor="servo-position">Position {pulseWidth}ms</label>
        </div>
      </div>
    </WebSerialConditional>
  )
}
