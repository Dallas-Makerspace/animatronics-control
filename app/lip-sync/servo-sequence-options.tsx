import { useState } from "react";
import { RandomBoostRangeTypes, ServoSequenceOptions } from "../types";
import { Tooltip } from "@nextui-org/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
export interface ServoSequenceOptionsProps {
  servoSequenceOptions: ServoSequenceOptions;
  onChange: (options: ServoSequenceOptions) => void;
}

export default function ServoSequenceOptionsComponent(props: ServoSequenceOptionsProps): JSX.Element {
  const [options, setOptions] = useState<ServoSequenceOptions>(props.servoSequenceOptions);
  const [onChange] = useState<(options: ServoSequenceOptions) => void>(() => props.onChange);

  const updateOptions = (newOptions: ServoSequenceOptions) => {
    setOptions(newOptions);
    onChange && onChange(newOptions);
  }

  const tooltipClassNames = {
    base: [
      // arrow color
      "before:bg-neutral-400 dark:before:bg-white",
    ],
    content: [
      "py-2 px-4 shadow-xl",
      "text-black bg-gradient-to-br from-white to-neutral-400",
    ],
  }

  return (
    <div>
      <h2>Servo Sequence Options</h2>
      <div className="flex gap-2">
        <label>
          Inverted:
          <input type="checkbox" checked={options.inverted} onChange={(e) => updateOptions({...options, inverted: e.target.checked})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
      <div className="flex gap-2">
        <label>
          Use Normalized Amplitude:
          <input type="checkbox" checked={options.useNormalizedAmplitude} onChange={(e) => updateOptions({...options, useNormalizedAmplitude: e.target.checked})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
      <div className="flex gap-2">
        <label>
          Servo Floor Boost:
          <input type="number" value={options.servoFloorBoost} onChange={(e) => updateOptions({...options, servoFloorBoost: Number(e.target.value)})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
      <div className="flex gap-2">
        <label>
          Floor Boost Min Amplitude:
          <input type="number" value={options.floorBoostMinAmplitude} onChange={(e) => updateOptions({...options, floorBoostMinAmplitude: Number(e.target.value)})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
      <div className="flex gap-2">
        <label>
          Floor Boost Max Amplitude:
          <input type="number" value={options.floorBoostMaxAmplitude} onChange={(e) => updateOptions({...options, floorBoostMaxAmplitude: Number(e.target.value)})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
      {/* <div>
        <label>
          Servo Range:
          <input type="number" value={options.servoRange} onChange={(e) => updateOptions({...options, servoRange: Number(e.target.value)})} />
        </label>
      </div> */}
      <div className="grid gap-2">
        <label>
          Servo Random Boost:
          <input type="checkbox" checked={options.servoRandomBoost} onChange={(e) => updateOptions({...options, servoRandomBoost: e.target.checked})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>        
        { options.servoRandomBoost && (
          <div className="flex gap-2">
            <label>
              Random Boost Min:
              <input style={{width: '60px'}} type="number" value={options.servoRandomBoostMin} onChange={(e) => updateOptions({...options, servoRandomBoostMin: Number(e.target.value)})} />
            </label>
            <label>
              Random Boost Max:
              <input style={{width: '60px'}} type="number" value={options.servoRandomBoostMax} onChange={(e) => updateOptions({...options, servoRandomBoostMax: Number(e.target.value)})} />
            </label>
            <label>
              Min Amplitude:
              <input style={{width: '60px'}} type="number" step={0.01} value={options.servoRandomBoostMinAmplitude} onChange={(e) => updateOptions({...options, servoRandomBoostMinAmplitude: Number(e.target.value)})} />
            </label>
            <label>
              Max Amplitude:
              <input style={{width: '60px'}} type="number" step={0.01} value={options.servoRandomBoostMaxAmplitude} onChange={(e) => updateOptions({...options, servoRandomBoostMaxAmplitude: Number(e.target.value)})} />
            </label>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <label>
          Randomize no change samples:
          <input type="checkbox" checked={options.noChangeRandomize} onChange={(e) => updateOptions({...options, noChangeRandomize: e.target.checked})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
        { options.noChangeRandomize && (
          <div className="flex gap-2">
            <label>
              No change randomize strategy:
              <select value={options.noChangeRandomizeRangeBoost} onChange={(e) => updateOptions({...options, noChangeRandomizeRangeBoost: e.target.value as RandomBoostRangeTypes})}>
                <option value="0 to +range">0 to +range</option>
                <option value="0 to -range">0 to -range</option>
                <option value="0 to range by directions from last">0 to range by directions from last</option>
                <option value="-range/2 to +range/2">-range/2 to +range/2</option>
                <option value="-range to +range">-range to +range</option>
              </select>
            </label>
          </div>
        )}
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
      <div className="flex gap-2">
        <label>
          Boost no change @ level 25:
          <input type="checkbox" checked={options.boostNoChangeLevel25} onChange={(e) => updateOptions({...options, boostNoChangeLevel25: e.target.checked})} />
        </label>
        <Tooltip 
          showArrow 
          placement="right"
          content="I am a tooltip"
          classNames={tooltipClassNames}
        >
          <InformationCircleIcon className="w-6" color="primary"/>
        </Tooltip>
      </div>
    </div>
  )
}