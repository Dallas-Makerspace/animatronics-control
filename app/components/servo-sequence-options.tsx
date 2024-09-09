import { useState } from "react";
import { ServoSequenceOptions } from "../types";

export interface ServoSequenceOptionsProps {
  servoSequenceOptions: ServoSequenceOptions;
  onChange: (options: ServoSequenceOptions) => void;
}

export default function ServoSequenceOptionsComponent(props: ServoSequenceOptionsProps): JSX.Element {
  const [options, setOptions] = useState<ServoSequenceOptions>(props.servoSequenceOptions);
  const [onChange] = useState<(options: ServoSequenceOptions) => void>(props.onChange);

  const updateOptions = (newOptions: ServoSequenceOptions) => {
    setOptions(newOptions);
    onChange && onChange(newOptions);
  }

  return (
    <div>
      <h2>Servo Sequence Options</h2>
      <div>
        <label>
          Inverted:
          <input type="checkbox" checked={options.inverted} onChange={(e) => updateOptions({...options, inverted: e.target.checked})} />
        </label>
      </div>
      <div>
        <label>
          Use Normalized Amplitude:
          <input type="checkbox" checked={options.useNormalizedAmplitude} onChange={(e) => updateOptions({...options, useNormalizedAmplitude: e.target.checked})} />
        </label>
      </div>
      <div>
        <label>
          Servo Floor Boost:
          <input type="number" value={options.servoFloorBoost} onChange={(e) => updateOptions({...options, servoFloorBoost: Number(e.target.value)})} />
        </label>
      </div>
      <div>
        <label>
          Floor Boost Min Amplitude:
          <input type="number" value={options.floorBoostMinAmplitude} onChange={(e) => updateOptions({...options, floorBoostMinAmplitude: Number(e.target.value)})} />
        </label>
      </div>
      <div>
        <label>
          Floor Boost Max Amplitude:
          <input type="number" value={options.floorBoostMaxAmplitude} onChange={(e) => updateOptions({...options, floorBoostMaxAmplitude: Number(e.target.value)})} />
        </label>
      </div>
      <div>
        <label>
          Servo Ceiling:
          <input type="number" value={options.servoCeiling} onChange={(e) => updateOptions({...options, servoCeiling: Number(e.target.value)})} />
        </label>
      </div>
      <div>
        <label>
          Servo Floor:
          <input type="number" value={options.servoFloor} onChange={(e) => updateOptions({...options, servoFloor: Number(e.target.value)})} />
        </label>
      </div>
      <div>
        <label>
          Servo Range:
          <input type="number" value={options.servoRange} onChange={(e) => updateOptions({...options, servoRange: Number(e.target.value)})} />
        </label>
      </div>
      <div>
        <label>
          Servo Random Boost:
          <input type="checkbox" checked={options.servoRandomBoost} onChange={(e) => updateOptions({...options, servoRandomBoost: e.target.checked})} />
        </label>
      </div>
    </div>
  )
}