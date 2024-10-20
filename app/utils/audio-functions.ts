/*
    This is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { AmplitudeTypes, ServoSequence, ServoSequenceOptions, ServoSequenceStats, SimpleEvent } from "../types";
import { sortMapByValues } from "./general";

// Based on https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/

// Set up audio context
// (window as any).AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
// const audioContext = new AudioContext();

/**
 * The size of the sample we average by (in milliseconds)
 */
export const sampleSize = 25;

/**
 * Filters the AudioBuffer retrieved from an external source
 * @param {AudioBuffer} audioBuffer the AudioBuffer from drawAudio()
 * @returns {Array} an array of floating point numbers
 */
export const filterData = (audioBuffer: AudioBuffer): Array<any> => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const rawDuration = audioBuffer.duration * 1000; // duration of the audio in milliseconds
  const samples = Math.floor(rawDuration / sampleSize) // 70; // Number of samples we want to have in our final data set
  console.log(`Raw data length: ${rawData.length}; Rate: ${audioBuffer.sampleRate} Hz; Duration: ${rawDuration} s; Samples: ${samples}`);
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
  }
  return filteredData;
};

/**
 * Normalizes the audio data to make a cleaner illustration 
 * @param {Array} filteredData the data from filterData()
 * @returns {Array} an normalized array of floating point numbers
 */
export const normalizeData = (filteredData: Array<any>): Array<any> => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
}

export const nativeDefaultServoSequenceOptions: ServoSequenceOptions = {
  inverted: true,
  useNormalizedAmplitude: true,
  servoFloor: 500,
  servoCeiling: 2500,
  servoFloorBoost: 90,
  floorBoostMinAmplitude: 0.0001,
  floorBoostMaxAmplitude: 0.4,
  servoRandomBoost: true,
  servoRandomBoostMin: 0,
  servoRandomBoostMax: 0,
  servoRandomBoostMinAmplitude: 0.1,
  servoRandomBoostMaxAmplitude: 0.5,
  noChangeRandomize: true,
  noChangeRandomizeRangeBoost: "0 to range by directions from last",
  boostNoChangeLevel25: true,
}

export const annServoSequenceOptions: ServoSequenceOptions = {
  ...nativeDefaultServoSequenceOptions,
  servoFloor: 680,
  servoCeiling: 1060,
  servoFloorBoost: 90,
}

export const billServoSequenceOptions: ServoSequenceOptions = {
  ...nativeDefaultServoSequenceOptions,
  servoFloor: 1361,
  servoCeiling: 1580,
  servoFloorBoost: 20,
}

/**
 * Default options for generating a servo sequence
 */
export const defaultServoSequenceOptions: ServoSequenceOptions = nativeDefaultServoSequenceOptions; // = billServoSequenceOptions

/**
 * Generates a servo sequence from the filtered audio data. Uses the sample size to determine the time of each event
 * @param filteredData 
 * @param options 
 * @returns 
 */
export const generateServoSequence = (filteredData: Array<number>, options: ServoSequenceOptions): ServoSequence => {
  const servoSequence: Array<SimpleEvent> = [];
  let time = 0;
  console.log(`ServoControls START re-rendering servo sequence. There are ${filteredData.length} samples. Options: ${JSON.stringify(options, null, 2)}`);
  const servoRange = options.servoRange ? options.servoRange : options.servoCeiling - options.servoFloor;
  const verboseDebugging = options.verboseDebugging || false;
  const verboseError = options.verboseError || false;
  const normalizedData = normalizeData(filteredData);
  const useNormalizedAmplitude = options.useNormalizedAmplitude || true;
  const audioSamples = useNormalizedAmplitude ? normalizedData : filteredData;

  const stats: ServoSequenceStats = { // crazy you can do this in TypeScript (having a constant object and mutate its properties)
    min: Math.min(...audioSamples),
    max: Math.max(...audioSamples),
    errors: new Map<string, number>(),
    counts: new Map<AmplitudeTypes, number>(),
    transitions: new Map<string, number>(),
    maxNoChangeSamples: 0,
    maxNoChangeSamplesDistribution: new Map<string, number>(),
  };
  const compareMin = stats.min.toFixed(4);
  let lastAmplitudeType: AmplitudeTypes = "other";
  let thisAmplitudeType: AmplitudeTypes = "other";
  let inNoChangeDuration = false;
  let noChangeSamples = 0;
  let thisTransition = "";
  let lastTransition = "";
  let samplePulseWidth = 0;

  servoSequence.push({ pulseWidth: options.servoFloor, sinceStart: 0 }); // insert first filler event (note loop starts at 1)
  for (let i = 1; i < audioSamples.length; i++) {
    const amplitude = audioSamples[i];
    const lastAmplitude = audioSamples[i - 1];
    const naturalPulseWidthAdjustment = Math.round((audioSamples[i] * servoRange)); // this will be bigger for more amplitude
    lastAmplitudeType = thisAmplitudeType; // save last amplitude type for transition
    lastTransition = thisTransition; // save last transition for no change duration
    const amplitudeAsString = amplitude.toFixed(4);
    if (amplitudeAsString === compareMin) { thisAmplitudeType = "0" }
    else if (amplitude < 0.25) { thisAmplitudeType = "0-25" }
    else if (amplitude < 0.5) { thisAmplitudeType = "25-50" }
    else if (amplitude < 0.75) { thisAmplitudeType = "50-75" }
    else if (amplitude < 1) { thisAmplitudeType = "75-100" }
    else if (amplitude === 1) { thisAmplitudeType = "max" }
    else { thisAmplitudeType = "other" };
    stats.counts.set(thisAmplitudeType, (stats.counts.get(thisAmplitudeType) || 0) + 1);
    thisTransition = `noChange: ${thisAmplitudeType}`;
    if (lastAmplitudeType !== thisAmplitudeType) {
      thisTransition = `${lastAmplitudeType} -> ${thisAmplitudeType}`;
      if (inNoChangeDuration) {
        // well, that was a fun run...
        stats.maxNoChangeSamples = Math.max(stats.maxNoChangeSamples, noChangeSamples);
        stats.maxNoChangeSamplesDistribution.set(lastTransition, Math.max(stats.maxNoChangeSamplesDistribution.get(lastTransition) || 0, noChangeSamples));
        inNoChangeDuration = false;
        noChangeSamples = 0;
      }
    } else { // no change
      inNoChangeDuration = true;
      noChangeSamples ++;
    }
    stats.transitions.set(thisTransition, (stats.transitions.get(thisTransition) || 0) + 1);
    time = i * sampleSize; // alternative: time += sampleSize; // Each sample is sampleSize ms long (see filterData in audio-functions.ts)

    let pulseWidthAdjustment = naturalPulseWidthAdjustment
    verboseDebugging && console.log(`ServoControls sample ${i} at ${time}ms: amplitude ${amplitudeAsString} (${thisAmplitudeType})\n pulse width adjustment ${pulseWidthAdjustment}`);
    if (options.noChangeRandomize && thisTransition.startsWith("noChange")) {
      let noChangeLevel = thisTransition.split(":")[1].trim();
      if (noChangeLevel != "0" && noChangeLevel != "max") { // don't randomize either extreme

        if (options.boostNoChangeLevel25 && noChangeLevel === "0-25") { noChangeLevel = "0-50" }
        const [min, max] = noChangeLevel.split("-");
        const minLevel = Number(min);
        const maxLevel = Number(max);
        const range = maxLevel - minLevel;
        verboseDebugging && console.log(`transition: ${thisTransition}; noChangeLevel: ${noChangeLevel}; minLevel: ${minLevel}; maxLevel: ${maxLevel}; range: ${range}`);
        let randomPulseWidthAdjustment = 0;
        switch (options.noChangeRandomizeRangeBoost) {
          case "0 to +range":
            randomPulseWidthAdjustment = Math.round(Math.random() * range); // 0 to +range
            break;
          case "0 to -range":
            randomPulseWidthAdjustment = -1 * (Math.round(Math.random() * range)); // -range to 0
            break;
          case "0 to range by directions from last":
            randomPulseWidthAdjustment = Math.round(Math.random() * range); // 0 to +range
            if (lastAmplitude > amplitude) {
              randomPulseWidthAdjustment = -randomPulseWidthAdjustment; // 0 to -range
            }
            break;
          case "-range/2 to +range/2":
            randomPulseWidthAdjustment = (Math.round(Math.random() * range) / 2) - range; // -range/2 to +range/2
            break;
          case "-range to +range":
            randomPulseWidthAdjustment = Math.round(Math.random() * (2 * range)) - range; // -range to +range
            break;
          default:
            console.error(`Invalid randomBoostRange: ${options.noChangeRandomizeRangeBoost}`);
            break;
        }

        pulseWidthAdjustment = pulseWidthAdjustment + randomPulseWidthAdjustment;
        verboseDebugging && console.log(`${thisAmplitudeType}: with ${randomPulseWidthAdjustment} AFTER pulse width adjustment ${pulseWidthAdjustment}`);
      }
    } else if (options.servoFloorBoost > 0) {
      if (amplitude > options.floorBoostMinAmplitude && amplitude <= options.floorBoostMaxAmplitude) {
        pulseWidthAdjustment = pulseWidthAdjustment + options.servoFloorBoost;
      }
    }
/*
    } else if (thisAmplitudeType === "0-25") {
      const fakeAmplitude = Math.random() * 0.5;
      const fakePulseWidthAdjustment = Math.round((fakeAmplitude * servoRange)); // this will be bigger for more amplitude
      pulseWidthAdjustment = fakePulseWidthAdjustment;
    }
*/

    verboseDebugging && console.log(`ServoControls sample ${i} at ${time}ms: amplitude ${amplitudeAsString} (${thisAmplitudeType})\n AFTER pulse width adjustment ${pulseWidthAdjustment}`);

    if(isNaN(pulseWidthAdjustment)) {
      const errorType = 'NaN VALUE ERROR in pulseWidthAdjustment';
      console.error(`${errorType}: ServoControls sample ${i} at ${time}ms: amplitude ${amplitudeAsString} (${thisAmplitudeType})\n pulse width adjustment ${pulseWidthAdjustment}`);
      stats.errors.set(errorType, (stats.errors.get(errorType) || 0) + 1);
      pulseWidthAdjustment = 0;
    } else {
      if (options.inverted) {
        samplePulseWidth = Math.floor(options.servoCeiling - pulseWidthAdjustment); // lower amplitude = higher pulse width
      } else {
        samplePulseWidth = Math.ceil(options.servoFloor + pulseWidthAdjustment); // lower amplitude = lower pulse width
      }
    }
    if (samplePulseWidth < options.servoFloor) {
      verboseError && console.error(`Sample at ${time} is below the floor ${samplePulseWidth}ms, raising to ${options.servoFloor}ms`);
      samplePulseWidth = options.servoFloor
      stats.errors.set('Below floor', (stats.errors.get('Below floor') || 0) + 1);
    }
    if (samplePulseWidth > options.servoCeiling) {
      verboseError && console.error(`Sample at ${time} is above the ceiling ${samplePulseWidth}ms, lowering to ${options.servoCeiling}ms`);
      samplePulseWidth = options.servoCeiling
      stats.errors.set('Above ceiling', (stats.errors.get('Above ceiling') || 0) + 1);
    }
    servoSequence.push({ pulseWidth: samplePulseWidth, sinceStart: time });
  }
  const sortedCountValues = sortMapByValues(stats.counts);
  const sortedTransitionValues = sortMapByValues(stats.transitions);
  const sortedMaxNoChangeSamplesValues = sortMapByValues(stats.maxNoChangeSamplesDistribution);
  const outputStats = {
    ...stats,
    counts: sortedCountValues, 
    transitions: sortedTransitionValues,
    maxNoChangeSamplesDistribution: sortedMaxNoChangeSamplesValues,
    // counts: Object.fromEntries(stats.counts), 
    // transitions: Object.fromEntries(stats.transitions),
    // maxNoChangeSamples: Object.fromEntries(stats.maxNoChangeSamplesDistribution)
  };
  console.log(`ServoControls DONE re-rendering servo sequence. There are ${servoSequence.length} events. Stats: ${JSON.stringify({
    ...outputStats,
    counts: Object.fromEntries(sortedCountValues), 
    transitions: Object.fromEntries(sortedTransitionValues),
    maxNoChangeSamples: Object.fromEntries(sortedMaxNoChangeSamplesValues),
    errors: Object.fromEntries(stats.errors),
  }, null, 2)}`);
  return { sequence: servoSequence, stats: outputStats };
};

