"use client";
import React, { useState, useContext, useEffect} from "react";
import ServoInput from "../components/servo-input";
import { ServoSettings, ServoWithName, getNewNamedServo } from "../types";
import SerialContext from "../contexts/serial";
import SettingsContext from "../contexts/settings";
import WebSerialConditional from "../components/webserial-conditional";
import { Button } from "@nextui-org/button"
import { Select, SelectItem } from "@nextui-org/react";
import SavedServoSettingsPicker from "../components/saved-servo-settings-picker";

export default function ServoPage() {
  const serialContext = useContext(SerialContext);
  const settingsContext = useContext(SettingsContext);
  const [servos, setServos] = useState<ServoWithName[]>([getNewNamedServo(0)]);
  const [live, setLive] = useState(false);

  const onServoChange = (index: number, newServo: ServoWithName): boolean => {
    // Validate the servo changes
    if (newServo.channel !== -1) {
      // Channel must be unique in the array of servos
      const channelExists = (index: number, newChannel: number) => servos.filter((servo, i) => i !== index && servo.channel === newChannel).length > 0;
      if (channelExists(index, newServo.channel)) {
        const oldChannel = servos[index].channel;
        const channelChangeDirection = oldChannel < newServo.channel ? +1 : -1;
        console.log(`Servo at index ${index} changing channel from ${oldChannel} to ${newServo.channel}, but channel already exists. Direction ${channelChangeDirection}. Looking for alternate.`);
        while (channelExists(index, newServo.channel)) {
          newServo.channel += channelChangeDirection;
          if (newServo.channel === -1) {
            break; // stop at -1 (no channel)
          }
          if (newServo.channel > 30) {
            console.log(`Channel ${newServo.channel} is out of bounds. Failing change.`);
            return false;
          }
        }
        console.log(`Servo at index ${index} changing channel from ${oldChannel} to ${newServo.channel}. Found alternate.`);
      }
    }
    if (newServo.minPulse > newServo.maxPulse) {
      console.log(`Min pulse ${newServo.minPulse} is greater than max pulse ${newServo.maxPulse}. Failing change.`);
      return false;
    }
    if (newServo.pulseWidth < newServo.minPulse || newServo.pulseWidth > newServo.maxPulse) {
      console.log(`Pulse width ${newServo.pulseWidth} is not between min ${newServo.minPulse} and max ${newServo.maxPulse}. Failing change.`);
      return false;
    }
    const newServos = [...servos];
    newServos[index] = newServo;
    setServos(newServos);

    if (live) {
      if (!serialContext.connected) {
        throw new Error('Serial not connected, cannot send servo changes');
        // this is an error because it's very rare and might be a bug in the code
      }
      if (newServo.pulseWidth != servos[index].pulseWidth) { // todo: possibly put this on a flag (always send vs only on change)
        // Send the servo changes to the servo controller
        const serialMessage = `#${newServo.channel}P${newServo.pulseWidth}\r`;
        try {
          const enc = new TextEncoder(); // always utf-8
          serialContext.writer?.write(enc.encode(serialMessage));
          console.log(`Sent serial message: ${serialMessage}`);
        } catch (e) {
          throw new Error(`Failed to send serial message (${serialMessage}): ${e}`);
        }
        // if (!("TextEncoder" in window)) 
        //   alert("Sorry, this browser does not support TextEncoder...");
      }
    }

    return true;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <div>{ live ? 'Connected!' : 'Offline mode' }</div>
        <div>
          { servos.map((servo, index) => (
            <div key={index} className="flex"> 
              <ServoInput key={index} index={index} servo={servo} onChange={onServoChange} displayChannel displayMinMax displayName displayPulseWidth displayTestType />
              {/* <Button color="primary" onClick={() => setServos(servos.slice(0, index).concat(servos.slice(index + 1)))} isDisabled={(servos.length < 2)}>Remove</Button> */}
              <Button color="primary" onClick={() => setServos([...servos.slice(0, index), ...servos.slice(index + 1)])} isDisabled={(servos.length < 2)}>Remove</Button>
              <Button onClick={() => settingsContext.setServoSettings(servo as ServoSettings) }>Save</Button>
            </div>
          ))}
          <Button onClick={() => setServos([...servos, getNewNamedServo(servos.length)])}>Add Servo</Button>
          <SavedServoSettingsPicker onSavedServoSettingsSelect={(servoSettings) => setServos([...servos, servoSettings])} />
        </div>
      </div>
      <WebSerialConditional>
        <div>
          <Button onClick={() => setLive(!live)} isDisabled={!serialContext.connected}>{live ? "Stop" : "Start"} Live Mode</Button>
        </div>
      </WebSerialConditional>
    </main>
  );
}
