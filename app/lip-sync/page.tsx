"use client";
import { useState } from "react";
import AmplitudeCanvas from "./amplitudeCanvas";
import ServoControls from "./servo-controls";
import AudioFilePicker from "./audio-file-picker";
import { promiseLog } from "../utils/logging";
import { filterData } from "../utils/audio-functions";
import { arrayBuffer } from "stream/consumers";
import { filter } from "framer-motion/client";
import { SimpleEvent } from "../types";

export default function LipSyncPage() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<Array<number>>([]);
  const [servoSequence, setServoSequence] = useState<Array<SimpleEvent>>([]);

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
      <div>
        <ServoControls filteredData={filteredData} audioSrc={audioSrc} audioPlay={()=> new Promise(() => console.log("TODO: not implemented"))} audioSeek={()=>{}} />
      </div>
    </main>
  );
}
