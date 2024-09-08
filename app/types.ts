/** Definition of a servo */
export interface Servo{
  /** The channel (id) of this servo */
  channel: number
  /** The minimum pulse sent to this servo, in milliseconds */
  minPulse: number
  /** The maximum pulse sent to this servo, in milliseconds */
  maxPulse: number
  /** The current pulse sent to this servo, in milliseconds */
  pulseWidth: number
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
