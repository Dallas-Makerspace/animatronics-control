/** Definition of a servo */
export interface Servo {
  /** The channel (id) of this servo */
  channel: number
  /** The minimum pulse sent to this servo, in microseconds */
  minPulse: number
  /** The maximum pulse sent to this servo, in microseconds */
  maxPulse: number
  /** The current pulse sent to this servo, in microseconds */
  pulseWidth: number
}

export interface ServoSettings {
  /** The name of these settings */
  name: string
  /** The channel (id) of this servo */
  channel: number
  /** The minimum pulse sent to this servo, in microseconds */
  minPulse: number
  /** The maximum pulse sent to this servo, in microseconds */
  maxPulse: number
}

export interface ServoWithName extends Servo, ServoSettings {}

export const getNewServoSettings = (index: number = 0): ServoSettings => {
  const servo: ServoSettings = {
    name: `Servo ${index}`,
    channel: -1,
    minPulse: 0,
    maxPulse: 2000,
  };
  return servo;
};

export const getNewNamedServo = (index: number = 0): ServoWithName => {
  return {...getNewServoSettings(index), pulseWidth: 1000 } as ServoWithName;
}

export interface ShowSequence {
  /** The name of the sequence */
  name: string
  /** The sequence of servo positions */
  sequence: Array<ShowEvent>
}

/** Definition of a show event, i.e. including a channel number */
export interface ShowEvent extends SimpleEvent {
  /** The channel for this event to be played on */
  channel: number
}

/** Definition of the simplest event - a pulseWidth and when (relative to start) it should be fired */
export interface SimpleEvent {
  /** Number of milliseconds since the show start for this event to fire */
  sinceStart: number
  /** The pulse width target of this event */
  pulseWidth: number
}

export type AmplitudeTypes = "0" | "0-25" | "25-50" | "50-75" | "75-100" | "max" | "other";

export interface ServoSequenceStats {
  min: number;
  max: number;
  errors: Map<string, number>;
  counts: Map<AmplitudeTypes, number>;
  transitions: Map<string, number>;
  maxNoChangeSamples: number;
  maxNoChangeSamplesDistribution: Map<string, number>;
}

/**
 * Options for generating a random boost range for a servoSequence
 * @option "0 to +range" - generate a positive random boost from 0 to range
 * @option "0 to -range" - generate a negative random boost from 0 to range
 * @option "0 to range by directions from last" - generate a random boost from 0 to range, based on the direction of the last sample (if it was positive, generate a positive boost, if it was negative, generate a negative boost)
 * @option "-range/2 to +range/2" - generate a random boost from -range/2 to +range/2
 * @option "-range to +range" - generate a random boost from -range to +range
 */
export type RandomBoostRangeTypes = "0 to +range" | "0 to -range" | "0 to range by directions from last" | "-range/2 to +range/2" | "-range to +range";

/**
* Options for generating a servo sequence
*/
export interface ServoSequenceOptions {
 /** Should the servo output be inverted (lower amplitude = higher pulse width) */
 inverted: boolean;
 /** Should the amplitude be normalized to make cleaner (see `normalizeData`); Defaults to true*/
 useNormalizedAmplitude?: boolean;
 /** The minimum pulse width offset for the servo for a non-zero (quiet) amplitude sound  */
 servoFloorBoost: number;
 /** The minimum amplitude sound to apply the floor to (how much louder than 0 should it be?) */
 floorBoostMinAmplitude: number;
 /** The maximum amplitude sound to apply the floor to */
 floorBoostMaxAmplitude: number;
 /** The maximum pulse width offset for the servo for a full amplitude sound */
 servoCeiling: number;
 /** The minimum pulse width offset for the servo (for no sound amplitude) */
 servoFloor: number;
 /** The range of the servo in µs (if not set, this will be servoCeiling - servoFloor) */
 servoRange?: number;
 /** Should we apply a random boost to the servo */
 servoRandomBoost: boolean;
 /** The minimum random boost to apply to the servo */
 servoRandomBoostMin: number;
 /** The maximum random boost to apply to the servo */
 servoRandomBoostMax: number;
 /** The minimum amplitude sound to apply the random boost to */
 servoRandomBoostMinAmplitude: number;
 /** The maximum amplitude sound to apply the random boost to */
 servoRandomBoostMaxAmplitude: number;
 /** Should samples that haven't changed since the last sample be randomized (generates more movement) */
 noChangeRandomize: boolean;
 /** The type of range of the random boost when noChangeRandomize is true, based on the range that the sample is currently in  */
 noChangeRandomizeRangeBoost: RandomBoostRangeTypes;
 /** Should the 0-25 amplitude level be boosted to 0-50 when randomizing samples that haven't changed (see `noChangeRandomize`) */
 boostNoChangeLevel25: boolean;
 /** Should we output verbose error information; defaults to false if omitted */
 verboseError?: boolean;
 /** Should we output verbose debugging information; defaults to false if omitted */
 verboseDebugging?: boolean;
}

/**
 * A servo sequence is the simplest sequence of events that can be played back on a servo, with only the time offset and the pulse width to send the servo
 * @param sequence the sequence of events to play back
 * @param options the options used when generating the sequence
 * @param stats the statistics gathered while generating the sequence
 */
export interface ServoSequence{
  /** the sequence of events to play back */
  sequence: Array<SimpleEvent>;
  /** the options used when generating this sequence */
  options?: ServoSequenceOptions;
  //** the statistics gathered while generating this sequence */
  stats?: ServoSequenceStats;
}

export const getNewServoSequence = (): ServoSequence => {
  return {
    sequence: [],
  }
}

/**
 * 
 */
export interface FileOutput {
  /** The type of this file's structure */
  fileType: "servo-settings" | "servo-sequence" | "servo-show";
  schemaVersion: string;
  data: any;
}

export interface ServoSettingsFileOutput extends FileOutput {
  fileType: "servo-settings";
  schemaVersion: "1.0";
  data: Array<ServoSettings>;
}

export interface ServoSequenceFileOutput extends FileOutput {
  fileType: "servo-sequence";
  schemaVersion: "0.1";
  data: ServoSequence;
}