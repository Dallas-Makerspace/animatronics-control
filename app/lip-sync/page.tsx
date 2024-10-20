"use client";
import { useContext, useEffect, useState } from "react";
import { useInterval } from "react-use";
import WebSerialConditional from "../components/webserial-conditional";
import ServoInput from "../components/servo-input";
import AmplitudeCanvas from "./amplitudeCanvas";
import AudioFilePicker from "./audio-file-picker";
import ServoSequenceOptionsComponent from "./servo-sequence-options";
import { promiseLog } from "../utils/logging";
import { defaultServoSequenceOptions, filterData, generateServoSequence, sampleSize } from "../utils/audio-functions";
import { ServoSequenceOptions, Servo, getNewNamedServo, ServoSequenceFileOutput, ServoSequence, getNewServoSequence, ServoWithName } from "../types";
import SerialContext from "../contexts/serial";
import { Button } from "@nextui-org/button";
import SavedServoSettingsPicker from "../components/saved-servo-settings-picker";
import { DownloadButton } from "../components/download-button";

// interface LipSyncPageProps {
//   filteredData: Array<number>;
//   audioSrc: string | null;
//   audioPlay: () => Promise<void>;
//   audioSeek: (time: number) => void;
//   servoSequenceOptions? : ServoSequenceOptions;
// }


export default function LipSyncPage() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<Array<number>>([]);
  const [servoSequence, setServoSequence] = useState<ServoSequence>(getNewServoSequence());
  const [servoSequenceOptions, setServoSequenceOptions] = useState<ServoSequenceOptions>({...defaultServoSequenceOptions});
  const [channel, setChannel] = useState<number>(-1);
  const [servoSettingsName, setServoSettingsName] = useState<string>("");

  // check these for being used
  const [servoPlaybackOffset, setServoPlaybackOffset] = useState<number>(-1);
  const [audioPlay, setAudioPlay] = useState<() => Promise<void>>(() => () => new Promise(() => console.error("TODO: not implemented")));
  const [audioSeek, setAudioSeek] = useState<(time: number) => void>(() => () => {console.error("TODO: not implemented")});

  const [playbackStarted, setPlaybackStarted] = useState<number>(-1);
  const serialContext = useContext(SerialContext);

  const onAudioFileChange = (newSource: string) => {
    const audioContext = new OfflineAudioContext({
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100,
    });
    console.log(`New audio source: ${newSource}`);
    setAudioSrc(newSource);
    fetch(newSource)
    .then(response => response.arrayBuffer())
    .then(input => promiseLog(input, "Got audio buffer"))
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(input => promiseLog(input, "Decoded audio buffer"))
    .then(audioBuffer => new Promise((resolve, reject) => {
      const filteredData = filterData(audioBuffer);
      setFilteredData(filteredData);
    }))
    .then(input => promiseLog(input, "State based filter data updated (Canvas drawn)"));
  };

  const onServoSequenceOptionsChange = (newOptions: ServoSequenceOptions) => {
    setServoSequenceOptions(newOptions);
  };

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      console.log("Lip Sync filteredData is empty, clearing servo sequence");
      setServoSequence(getNewServoSequence());
    } else {
      console.log("ServoControls re-rendering servo sequence");
      const generatedSequence = generateServoSequence(filteredData, servoSequenceOptions);
      setServoSequence(generatedSequence);
      // TODO: Publish stats with a callback? servoSequence.stats
    }
  }, [filteredData, servoSequenceOptions]);

  useInterval(
    () => {
      const index = servoPlaybackOffset;
      // TODO: Playback stats
      if (index < 0 || index >= servoSequence.sequence.length) {
        console.log("Servo playback has reached the end of the sequence");
        setServoPlaybackOffset(-1); // stops the interval
        return;
      }
      const pulseWidth = servoSequence.sequence[index].pulseWidth;
      const sinceStart = servoSequence.sequence[index].sinceStart;
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

  const playSequence = () => {
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

  const changeServo = (index: number, newServo: Servo): boolean => {
    if (newServo.channel !== channel) {
      console.log(`Channel ${channel} changed to ${newServo.channel}`);
      setChannel(newServo.channel);
    } else { // channel is the same, so we can update the servo properties, which will recalculate the servo sequence
      if(servoSettingsName != "") {
        setServoSettingsName(""); // clear the servo settings name if we change anything other than the channel
      }
      const newServoSequenceOptions = {...servoSequenceOptions, servoFloor: newServo.minPulse, servoCeiling: newServo.maxPulse};
      setServoSequenceOptions(newServoSequenceOptions);
    }
    return true;
  }

  const generateServoSequenceBlob = () => {
    const output: ServoSequenceFileOutput = {
      fileType: 'servo-sequence',
      schemaVersion: '0.1',
      data: servoSequence,
    }
    return new Blob([JSON.stringify(output, null, 2)], {type: 'application/json'});
  }

  const loadServoSettings = (servoSettings: ServoWithName) => {
    setServoSettingsName(servoSettings.name);
    changeServo(-1, servoSettings)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        From here we can create lip sync timing for the animatronics.
      </div>
      <div>
        <AudioFilePicker onAudioFileChange={onAudioFileChange} />
      </div>
      <div className="h-flex">
        <AmplitudeCanvas filterData={filteredData}/>
      </div>
      <div className="flex gap-4" />
      <div>
        <ServoSequenceOptionsComponent onChange={onServoSequenceOptionsChange} servoSequenceOptions={servoSequenceOptions} />
      </div>
      <div className="flex gap-4" />
      <div>
        <ServoInput 
          index={-1}
          servo={{...getNewNamedServo(), channel, minPulse: servoSequenceOptions.servoFloor, maxPulse: servoSequenceOptions.servoCeiling}} 
          onChange={changeServo}
          displayChannel
          displayMinMax
          alwaysEnabled
        />
      </div>
      <SavedServoSettingsPicker onSavedServoSettingsSelect={loadServoSettings} />
      <div className="flex gap-4" />
      <div className="flex">
        <WebSerialConditional getStartedMessage="to play this lip sync on a servo.">
          <div className="flex">
            {(servoSequence.sequence.length > 0)  && channel > -1 && ( // when should the play / stop buttons be shown?
              (servoPlaybackOffset === -1) ? // show play unless we are playing
                <Button onClick={playSequence}>Play</Button> 
                : // in which case show stop
                <Button onClick={stopSequence}>Stop</Button>
            )}
          </div>
        </WebSerialConditional>
        {(servoSequence.sequence.length > 0) && ( // when should the save button be shown?
          <DownloadButton
            title="Save Sequence" 
            defaultFileName={`${servoSettingsName}-servo-sequence.json`}
            includeTimestamp
            generateBlob={generateServoSequenceBlob}
          />)
        }
      </div>    
    </main>
  );
}
