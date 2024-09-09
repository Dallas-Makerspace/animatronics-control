import { useState } from "react"
import { useInterval } from "react-use"
import { Servo } from "../types";
import { p } from "framer-motion/client";
import { Button } from "@nextui-org/button";

interface ServoInputProps {
  servo: Servo
  index: number
  onChange: (index: number, servo: Servo) => boolean
}

export default function ServoInput(props: ServoInputProps) {
  const [testType, setTestType] = useState('none');
  const servo = props.servo;

  const channel = servo ? servo.channel : -1;
  const minPulse = servo ? servo.minPulse : 0;
  const maxPulse = servo ? servo.maxPulse : 2000;
  const pulseWidth = servo ? servo.pulseWidth : 1000;
  const parentOnChange = props.onChange;
  const index = props.index;
  const fastSweepMilliseconds = 100;

  const safeParentOnChange = (newServo : Servo): boolean => {
    if (parentOnChange && (typeof parentOnChange === 'function')) {
      return parentOnChange(index, newServo)
    } else {
      throw new Error('parentOnChange is not a function')
    }
  }

  const onChannelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChannel = Number(e.target.value)
    if (newChannel === -1) {
      setTestType('none');
    }
    const newServo = {...servo, channel:newChannel}
    safeParentOnChange(newServo) || e.preventDefault()
  }

  const onMinPulseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinPulse = Number(e.target.value)
    let newServo: Servo
    if (newMinPulse > pulseWidth) {
      newServo = {...servo, minPulse: newMinPulse, pulseWidth: newMinPulse}
    } else {
      newServo = {...servo, minPulse: newMinPulse}
    }
    safeParentOnChange(newServo) || e.preventDefault()
  }

  const onMaxPulseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxPulse = Number(e.target.value)
    let newServo: Servo
    if ( pulseWidth > newMaxPulse) {
      newServo = {...servo, maxPulse: newMaxPulse, pulseWidth: newMaxPulse}
    } else {
      newServo = {...servo, maxPulse: newMaxPulse}
    }
    safeParentOnChange(newServo) || e.preventDefault()
  }

  const onPulseWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newServo = {...servo, pulseWidth: Number(e.target.value)}
    safeParentOnChange(newServo) || e.preventDefault()
  }
  
  const onTestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`Test type change to ${e.target.value}`);
    if (e.target.value === 'none') {
      setTestType('none');
    } else if (e.target.value === 'sweep') {
      const currentPulseWidth = servo.pulseWidth;
      if (currentPulseWidth === maxPulse) {
        setTestType('sweep-decrement');
      } else {
        setTestType('sweep-increment');
      }
    } else if (e.target.value === 'fast-sweep') {
      const currentPulseWidth = servo.pulseWidth;
      if (maxPulse - minPulse < fastSweepMilliseconds) {
        console.log(`Fast sweep is not possible. Range too small: ${maxPulse - minPulse}ms`);
        setTestType('none');
        return;
      }
      if ((currentPulseWidth + fastSweepMilliseconds) >= maxPulse) {
        setTestType('sweep-fast-decrement');
      } else {
        setTestType('sweep-fast-increment');
      }
    } else if (e.target.value === 'sweep-points') {
      setTestType('sweep-points-increment');
    } else if (e.target.value === 'random') {
      setTestType('random');
    } else if (e.target.value === 'min') {
      setTestType('min');
    } else if (e.target.value === 'mid') {  
      setTestType('mid');
    } else if (e.target.value === 'max') {
      setTestType('max');
    } else {
      console.error(`Unknown test type: ${e.target.value}`);
      setTestType('none');
    }
  }

  useInterval(
    () => {
      const currentPulseWidth = servo.pulseWidth;
      let newPulseWidth = currentPulseWidth;
      if (testType.startsWith('sweep-points')) {
        const midPoint = Math.floor((maxPulse - minPulse) / 2 + minPulse);
        const increment = testType.startsWith('sweep-points-increment');
        const counter = Number(testType.split('-')[3]);
        if (counter < 10) {
          // just increment counter - we haven't been here long enough
          setTestType(`sweep-points-${increment ? 'increment' : 'decrement'}-${counter + 1}`);
        } else {
          // we've been here long enough, time to move on
          let newTestType = 'sweep-points-increment-0';
          if (increment) {
            if (currentPulseWidth === minPulse) {
              newPulseWidth = midPoint;
            } else if (currentPulseWidth === midPoint) {
              newPulseWidth = maxPulse;
            } else {
              newPulseWidth = midPoint;
              newTestType = 'sweep-points-decrement-0';
            }
          } else { // decrement
            if (currentPulseWidth === maxPulse) {
              newPulseWidth = midPoint;
            } else if (currentPulseWidth === midPoint) {
              newPulseWidth = minPulse;
            } else {
              newPulseWidth = midPoint;
              newTestType = 'sweep-points-increment-0';
            }
          }
          setTestType(newTestType);
        }
      } else {
        switch (testType) {
          case 'sweep-increment':
            newPulseWidth = currentPulseWidth + 1;
            if (currentPulseWidth === maxPulse) {
              setTestType('sweep-decrement');
            }
            break;
          case 'sweep-decrement':
            newPulseWidth = currentPulseWidth - 1;
            if (currentPulseWidth === minPulse) {
              setTestType('sweep-increment');
            }
            break;
          case 'sweep-fast-increment':
            newPulseWidth = currentPulseWidth + fastSweepMilliseconds;
            if (newPulseWidth >= maxPulse) {
              setTestType('sweep-fast-decrement');
              newPulseWidth = maxPulse;
            }
            break;
          case 'sweep-fast-decrement':
            newPulseWidth = currentPulseWidth - fastSweepMilliseconds;
            if (newPulseWidth <= minPulse) {
              setTestType('sweep-fast-increment');
              newPulseWidth = minPulse;
            }
            break;
          case 'random':
            newPulseWidth = Math.floor(Math.random() * (maxPulse - minPulse) + minPulse)
            break;
          case 'min':
            newPulseWidth = minPulse;
            break;
          case 'mid':
            newPulseWidth = Math.floor((maxPulse - minPulse) / 2 + minPulse);
            break;
          case 'max':
            newPulseWidth = maxPulse;
            break;
        }
      }
      const newServo = {...servo, pulseWidth: newPulseWidth}
      safeParentOnChange(newServo)

    },
    testType === 'none' ? null : 100
  )

  let testTypeSelected = testType;
  if (testType === 'sweep-increment' || testType === 'sweep-decrement') {
    testTypeSelected = 'sweep';
  } else if (testType === 'sweep-fast-increment' || testType === 'sweep-fast-decrement') {
    testTypeSelected = 'fast-sweep';
  } else if (testType.startsWith('sweep-points-')) {
    testTypeSelected = 'sweep-points';
  }
    
  return (
    <div className="flex">
      <div>
        <input type="range" id="channel" min="-1" max="31" value={channel} onChange={onChannelChange} step="1" />
        <label htmlFor="channel">Channel {channel} </label>
      </div>
      <div>
        <input type="range" id="min-position" min="0" max={maxPulse - 1} value={minPulse} onChange={onMinPulseChange} disabled={channel == -1}/>
        <label htmlFor="min-position">Min {minPulse}ms</label>
      </div>
      <div>
        <input type="range" id="max-position" min={minPulse + 1} max="2500" value={maxPulse} onChange={onMaxPulseChange} disabled={channel == -1}/>
        <label htmlFor="max-position">Max {maxPulse}ms</label>
      </div>
      <div>
        <input type="range" id="servo-position" min={minPulse} max={maxPulse} value={pulseWidth} step="1" onChange={onPulseWidthChange}  disabled={channel == -1}/>
        <label htmlFor="servo-position">Position {pulseWidth}ms</label>
      </div>
      <select id='test-type' name='test-type' value={testTypeSelected} onChange={onTestTypeChange} disabled={channel === -1}>
        <option value='none'>None</option>
        <option value='sweep-points'>Sweep points</option>
        <option value='sweep'>Sweep</option>
        <option value='fast-sweep'>Fast Sweep</option>
        <option value='random'>Random</option>
        <option value='min'>Min</option>
        <option value='mid'>Mid</option>
        <option value='max'>Max</option>
      </select>
    </div>
  );  
}