"use client";

import { useContext, useEffect, useState } from "react";
import SerialContext from "../contexts/serial";
import { SimpleEvent } from "../types";
import { useInterval } from "react-use";
import WebSerialConditional from "../components/webserial-conditional";
import { Button } from "@nextui-org/button";
import { normalize } from "path";
import { normalizeData, sampleSize } from "../utils/audio-functions";
import { start } from "repl";

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
  const [audioPlay, setAudioPlay] = useState<() => Promise<void>>(props.audioPlay);
  const [audioSeek, setAudioSeek] = useState<(time: number) => void>(props.audioSeek);
  const serialContext = useContext(SerialContext);

  useEffect(() => {
    if (!props.filteredData || props.filteredData.length === 0) {
      console.log("ServoControls filteredData is empty, clearing servo sequence");
      setServoSequence([]);
    } else {
      console.log("ServoControls re-rendering servo sequence");
      const servoSequence: Array<SimpleEvent> = [];
      let time = 0;
      let countOverMin = 0;
      let countUnderMax = 0;
      const servoRange = maxPulse - minPulse;
      const normalizedData = normalizeData(props.filteredData);
      const audioSamples = normalizedData;
      for (let i = 0; i < audioSamples.length; i++) {
        // const pulseWidth = Math.floor((props.filteredData[i] * servoRange) + minPulse);
        const pulseWidth = Math.ceil(maxPulse - (audioSamples[i] * servoRange));
        (pulseWidth > minPulse) && countOverMin++;
        (pulseWidth < maxPulse) && countUnderMax++;
        time = i * sampleSize; // alternative: time += 500; // Each sample is 500ms (see filterData in audio-functions.ts)
        servoSequence.push({ pulseWidth, sinceStart: time });
      }
      setServoSequence(servoSequence);
      console.log(`ServoControls DONE re-rendering servo sequence. There are ${servoSequence.length} events of which ${countOverMin} are over minimum and ${countUnderMax} are under maximum`);
    }
  }, [maxPulse, minPulse, props.filteredData]);

  useEffect(() => {
    if (props.audioPlay) {
      console.log("ServoControls updating audioPlay");
      setAudioPlay(() => props.audioPlay);
    }
    if (props.audioSeek) {
      console.log("ServoControls updating audioSeek");
      setAudioSeek(() => props.audioSeek);
    }
  }, [props.audioPlay, props.audioSeek]);


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
      setServoPlaybackOffset(index + 1);
    },
    servoPlaybackOffset === -1 ? null : sampleSize // set interval to match sample size if we have a servoPlaybackOffset
  );

  const doPlaySequence = () => {
    const startAt = 19000;
    console.log("Playing servo sequence");
    setServoPlaybackOffset(Math.floor(startAt / sampleSize));
    // TODO: This is hacky!
    const audio = document.getElementById('lip-sync-audio') as HTMLAudioElement;
    if (audio) {
      // audio.currentTime = 0;
      // audio.play();
      audio.currentTime = startAt / 1000;
      audio.play();
    } else {
      console.error("No audio element found to play");
    }
  };

  const stopSequence = () => {
    console.log("Stopping servo sequence");
    setServoPlaybackOffset(-1);
    // TODO: This is hacky!
    const audio = document.getElementById('lip-sync-audio') as HTMLAudioElement;
    if (audio) {
      audio.pause();
    } else {
      console.error("No audio element found to pause");
    }
    
  };

  const onPulseWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPulseWidth = Number(e.target.value);
    setPulseWidth(newPulseWidth);
    const serialMessage = `#${channel}P${newPulseWidth}\r`;
    try {
      const enc = new TextEncoder(); // always utf-8
      serialContext.writer?.write(enc.encode(serialMessage));
      console.log(`Sent serial message: ${serialMessage}`);
    } catch (e) {
      throw new Error(`Failed to send serial message (${serialMessage}): ${e}`);
    }
  };

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
          <input type="range" id="servo-position" min={minPulse} max={maxPulse} value={pulseWidth} step="1" onChange={onPulseWidthChange}  disabled={channel == -1}/>
          <label htmlFor="servo-position">Position {pulseWidth}ms</label>
        </div>
      </div>
      {(servoSequence && servoSequence.length > 0 && channel > -1) && (
        (servoPlaybackOffset === -1) ? 
          <Button onClick={doPlaySequence}>Play</Button> 
          : 
          <Button onClick={stopSequence}>Stop</Button>
      )}
    </WebSerialConditional>
  )
}
