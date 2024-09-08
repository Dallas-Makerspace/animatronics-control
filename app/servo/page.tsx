"use client";
import { useState, useContext } from "react";
import ServoInput from "./ServoInput";
import { Servo } from "../types";
import SerialContext from "../contexts/serial";
import { Button } from "@nextui-org/button"
import WebSerialConditional from "../components/webserial-conditional";

const getNewServo = (): Servo => {
  const servo: Servo = {
    channel: -1,
    minPulse: 0,
    maxPulse: 2000,
    pulseWidth: 1000,
  };
  return servo;
};


export default function ServoPage() {
  const serialContext = useContext(SerialContext);
  const [servos, setServos] = useState<Servo[]>([getNewServo()]);
  const [live, setLive] = useState(false);

  const onServoChange = (index: number, newServo: Servo): boolean => {
    // Validate the servo changes
    if (newServo.channel !== -1) {
      // Channel must be unique in the array of servos
      const channelExists = servos.filter((servo, i) => i !== index && servo.channel === newServo.channel).length > 0;
      if (channelExists) {
        console.log(`Channel ${newServo.channel} already exists at index ${index}. Failing change.`);
        return false;
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

  const servoInputs = (<div>
      { servos.map((servo, index) => (
        <div key={index} className="flex"> 
          Servo {index + 1}
          <ServoInput key={index} index={index} servo={servo} onChange={onServoChange} />
          <Button color="primary" onClick={() => setServos(servos.slice(0, index).concat(servos.slice(index + 1)))} isDisabled={(servos.length < 2)}>Remove</Button>
        </div>
      ))}
      <Button onClick={() => setServos([...servos, getNewServo()])}>Add Servo</Button>
    </div>);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <div>{ live ? 'Connected!' : 'Offline mode' }</div>
        {servoInputs}        
      </div>
      <WebSerialConditional>
        <div>
          <Button onClick={() => setLive(!live)} isDisabled={!serialContext.connected}>{live ? "Stop" : "Start"} Live Mode</Button>
        </div>
      </WebSerialConditional>
      <div className="bg-red">
        <h2>Servos</h2>
        <pre>{JSON.stringify(servos, null, 2)}</pre>
      </div>
    </main>
  );
}
