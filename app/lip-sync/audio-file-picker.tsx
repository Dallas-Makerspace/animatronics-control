"use client";
import { createRef, useEffect, useState } from "react";

export type AudioFilePickerProps = {
  onAudioFileChange: (newSource: string) => void;
};

export default function AudioFilePicker(props: AudioFilePickerProps) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [onAudioFileChange, setOnAudioFileChange] = useState<((newSource: string) => void) | null>(null);
  const audio = createRef<HTMLAudioElement>();

  // let audio: HTMLAudioElement | null = null; 

  useEffect(() => {
    const newOnAudioFileChange = props.onAudioFileChange;
    if (newOnAudioFileChange !== onAudioFileChange) {
      setOnAudioFileChange(() => props.onAudioFileChange);
    }
  }, [props.onAudioFileChange, onAudioFileChange]);


  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ??? const audio = document.getElementById('lip-sync-audio') as HTMLAudioElement;
    if (event.target.files !== null) {
      // ??? audio.src = URL.createObjectURL(event.target.files[0]);
      if (audio.current != null) {
        audio.current!.src = URL.createObjectURL(event.target.files[0]);
      } else {
        console.error('Audio ref is null when trying to update source');
      }
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
      setAudioSrc(URL.createObjectURL(event.target.files[0]));
      if (onAudioFileChange) {
        onAudioFileChange(URL.createObjectURL(event.target.files[0]));
      }
    }
  }

  const onAudioPlay = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.log('Audio started playing');
    // TODO: we assume the audio is starting from the top
    // todo: send events to servos? What about syncing playback position?
  }

  return (
    <>
      <form>
        <label htmlFor="audio">Upload an audio file:</label>
        <input type="file" name="audio" accept="audio/*" onChange={handleAudioFileChange} />
        <label htmlFor="fileSize">Size:</label>{" "}
        <output id="fileSize">n/a</output>
      </form>
      <audio controls id='lip-sync-audio' onPlay={onAudioPlay} ref={audio}></audio>
    </>
  );
}
