"use client";

import { use, useContext, useEffect, useState } from "react";
import SerialContext from "../contexts/serial";
import { ServoSequenceOptions, SimpleEvent } from "../types";
import { useInterval } from "react-use";
import WebSerialConditional from "../components/webserial-conditional";
import { Button } from "@nextui-org/button";
import { defaultServoSequenceOptions, generateServoSequence, sampleSize } from "../utils/audio-functions";

interface ServoControlsProps {
  filteredData: Array<number>;
  audioSrc: string | null;
  audioPlay: () => Promise<void>;
  audioSeek: (time: number) => void;
  servoSequenceOptions: ServoSequenceOptions;
  servoSequenceOptionsOnChange: (options: ServoSequenceOptions) => void;
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
  const [inverted, setInverted] = useState<boolean>(true);
  const [playbackStarted, setPlaybackStarted] = useState<number>(-1);
  //const [servoSequenceOptions, setServoSequenceOptions] = useState<ServoSequenceOptions>(props.servoSequenceOptions);
  //const [onChangeServoSequenceOptions, setOnChangeServoSequenceOptions] = useState<(options: ServoSequenceOptions) => void>(props.servoSequenceOptionsOnChange);
  const serialContext = useContext(SerialContext);

  // useEffect(() => {
  //   let newServoSequenceOptions = {...servoSequenceOptions};
  //   if (maxPulse) {
  //     newServoSequenceOptions = {...newServoSequenceOptions, servoCeiling: maxPulse};
  //   }
  //   if (minPulse) {
  //     newServoSequenceOptions = {...newServoSequenceOptions, servoFloor: minPulse};
  //   }
  //   if (onChangeServoSequenceOptions) {
  //     onChangeServoSequenceOptions(newServoSequenceOptions);
  //   } else {
  //     console.error("No onChange for servoSequenceOptions in ServoControls, unable to push changes");
  //     setServoSequenceOptions(newServoSequenceOptions);
  //   }
  // }, [maxPulse, minPulse, onChangeServoSequenceOptions, servoSequenceOptions]);

  useEffect(() => {
    if (!props.filteredData || props.filteredData.length === 0) {
      console.log("ServoControls filteredData is empty, clearing servo sequence");
      setServoSequence([]);
    } else {
      console.log("ServoControls re-rendering servo sequence");
      const servoSequence = generateServoSequence(props.filteredData, defaultServoSequenceOptions); // servoSequenceOptions);
      setServoSequence(servoSequence.sequence);
      // TODO: Publish stats with a callback? servoSequence.stats
    }
  }, [inverted, maxPulse, minPulse, props.filteredData]); //, servoSequenceOptions]);

  // useEffect(() => {
  //   if (props.servoSequenceOptions) {
  //     console.log("ServoControls updating servoSequenceOptions");
  //     setServoSequenceOptions(() => props.servoSequenceOptions);
  //   }
  // }, [props.servoSequenceOptions]);

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

  // useEffect(() => {
  //   if (props.servoSequenceOptionsOnChange) {
  //     console.log("ServoControls updating servoSequenceOptionsOnChange");
  //     setOnChangeServoSequenceOptions(() => props.servoSequenceOptionsOnChange);
  //   }
  // }, [onChangeServoSequenceOptions, props.servoSequenceOptionsOnChange]);


  useInterval(
    () => {
      const index = servoPlaybackOffset;
      // TODO: Playback stats
      if (index < 0 || index >= servoSequence.length) {
        console.log("Servo playback has reached the end of the sequence");
        setServoPlaybackOffset(-1); // stops the interval
        return;
      }
      const pulseWidth = servoSequence[index].pulseWidth;
      const sinceStart = servoSequence[index].sinceStart;
      let nextIndex = index + 1;
      if(sinceStart % 10000 === 0) { // every 10 seconds
        const now = Date.now();
        const elapsed = now - playbackStarted;
        let delta = sinceStart - elapsed;
        console.log(`Ten second update: playing servo event ${index} at ${sinceStart}ms; ${elapsed}ms have elapsed (${delta}ms) with pulse width ${pulseWidth}ms`);
        if (delta > sampleSize) {
          const deltaSamples = Math.floor(delta / sampleSize);
          console.error(`Servo playback is ahead by ${delta}ms which exceeds ${sampleSize}ms of the sample size. Cheating back by replaying ${deltaSamples} samples.`);
          nextIndex = index - deltaSamples;
        } else if (delta < (sampleSize * -1)) {
          const deltaSamples = -1 * (Math.floor(delta / sampleSize));
          console.error(`Servo playback is behind by ${delta}ms which exceeds ${sampleSize}ms of the sample size. Cheating forward by skipping ${deltaSamples} samples.`);
          nextIndex = index + deltaSamples;
        }
      }
      //??console.log(`Playing servo event ${index} at ${sinceStart}ms with pulse width ${pulseWidth}ms`);
      // Send the servo changes to the servo controller
      const serialMessage = `#${channel}P${pulseWidth}\r`;
      try {
        const enc = new TextEncoder(); // always utf-8
        serialContext.writer?.write(enc.encode(serialMessage));
        //??console.log(`Sent serial message: ${serialMessage}`);
      } catch (e) {
        throw new Error(`Failed to send serial message (${serialMessage}): ${e}`);
      }
      setServoPlaybackOffset(nextIndex);
    },
    servoPlaybackOffset === -1 ? null : sampleSize // set interval to match sample size if we have a servoPlaybackOffset
  );

  const doPlaySequence = () => {
    const startAt = 0; //240000; // 0; // 19000;
    // TODO: This is hacky!
    const audio = document.getElementById('lip-sync-audio') as HTMLAudioElement;
    setServoPlaybackOffset(Math.floor(startAt / sampleSize));
    if (audio) {
      // audio.currentTime = 0;
      // audio.play();
      audio.currentTime = startAt / 1000;
      const now = Date.now();
      setPlaybackStarted(now);
      console.log("Playing servo sequence");  
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
      //??console.log(`Sent serial message: ${serialMessage}`);
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
