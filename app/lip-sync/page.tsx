"use client";
import { useState } from "react";
import AmplitudeCanvas from "./amplitudeCanvas";
import ServoControls from "./servo-controls";

export default function LipSyncPage() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<Array<number>>([]);


  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = document.getElementById('lip-sync-audio') as HTMLAudioElement;
    if (event.target.files !== null) {
      audio.src = URL.createObjectURL(event.target.files[0]);
      // Calculate total size
      const numberOfBytes = event.target.files[0].size;
      // Approximate to the closest prefixed unit
      const units = [
        "B",
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB",
      ];
      const exponent = Math.min(
        Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
        units.length - 1,
      );
      const approx = numberOfBytes / 1024 ** exponent;
      const output =
        exponent === 0
          ? `${numberOfBytes} bytes`
          : `${approx.toFixed(3)} ${
              units[exponent]
            } (${numberOfBytes} bytes)`;
  
      const fileSizeElement = document.getElementById("fileSize");
      if (fileSizeElement !== null) {
        fileSizeElement.textContent = output;
      }
      setAudioSrc(audio.src);
    }
  }

  const onFilteredData = (filteredData: Array<number>) => {
    console.log(`Got filtered data with ${filteredData.length} samples`);
    // currently samples are every 500ms (see amplitudeCanvas -> filterData -> sampleSize)
    // so we can assume 2 samples per second
    // TODO: Pass filtered data to servo-controls
    // setFilteredData(filteredData);
    // // generate servo events
    // const lipSyncSequence: Array<SimpleEvent> = [];
    // filteredData.forEach((amplitude, index) => {
    //   const sinceStart = index * 500;
    //   const pulseWidth = minPulse + ((maxPulse - minPulse) * amplitude);
    //   const newEvent: SimpleEvent = { sinceStart, pulseWidth };
    //   lipSyncSequence.push(newEvent);
    // }); // filterData for each
    // console.log(`Generated ${lipSyncSequence.length} events for our simple sequence`);
    // setServoSequence(lipSyncSequence);
  }
  
  const onAudioPlay = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.log('Audio started playing');
    // TODO: we assume the audio is starting from the top
    // todo: send events to servos
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        From here we can create lip sync timing for the animatronics.
        <form>
          <label htmlFor="audio">Upload an audio file:</label>
          <input type="file" name="audio" accept="audio/*" onChange={handleAudioFileChange} />
          <label htmlFor="fileSize">Size:</label>{" "}
          <output id="fileSize">n/a</output>
        </form>
        <audio controls id='lip-sync-audio' onPlay={onAudioPlay}></audio>
      </div>
      <div className="h-flex">
        <AmplitudeCanvas audioUrl={audioSrc} onFilteredData={onFilteredData}/>
      </div>
      {/* <div>
        <ServoControls />
      </div> */}
    </main>
  );
}
