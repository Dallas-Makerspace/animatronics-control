'use client'
import { useContext, useEffect, useState } from "react";
import SettingsContext from "../contexts/settings";
import { Button } from "@nextui-org/button";
import ServoInput from "../components/servo-input";
import { ServoWithName, getNewNamedServo, ServoSettings, ServoSettingsFileOutput } from "../types";
import { DownloadButton } from "../components/download-button";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";

export default function SettingsPage() {
  const settingsContext = useContext(SettingsContext)
  const [servos, setServos] = useState<ServoWithName[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { // little lifecycle hook so we match the SSR client state
    console.log('settings page mounted');
    setIsClient(true);

    return () => {
      console.log('settings page unmounted');
      setIsClient(false); // cleanup
    }
  }, []); // run once on mount

  useEffect(() => {
    console.log('servos changed - updating settings');
    for (let i = 0; i < servos.length; i++) {
      settingsContext.setServoSettings(servos[i] as ServoSettings);
    }
  }, [servos]);

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
    if (newServo.name !== servos[index].name) {
      // TODO: handle a name change (old name needs to be removed from settings)
      // TODO: check that new name is unique
      settingsContext.removeServoSettings(servos[index].name);
    }
    const newServos = [...servos];
    newServos[index] = newServo;
    setServos(newServos);
    return true;
  };

  const removeServo = (index: number) => () => {
    settingsContext.removeServoSettings(servos[index].name);
    setServos([...servos.slice(0, index), ...servos.slice(index + 1)])
  };

  if(isClient) { // load servos from settings on mount
    const knownServoNames = settingsContext.getDefinedServoNames();
    if (servos.length === 0 && knownServoNames.length > 0) {
      const newServos: ServoWithName[] = [];
      knownServoNames.forEach((servoName) => {
        newServos.push(settingsContext.getServoSettings(servoName as string) as ServoWithName);
      });
      setServos(newServos);
    }
  }

  const testContents = () => {
    return new Blob([JSON.stringify(servos, null, 2)], {type: 'application/json'});
  }

  const generateSettingsBlob = () => {
    const configOutput: ServoSettingsFileOutput = {
      fileType: 'servo-settings',
      schemaVersion: '1.0',
      data: servos //TODO: This contains extra properties that are not part of the interface
    }
    return new Blob([JSON.stringify(configOutput, null, 2)], {type: 'application/json'});
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>
        Someday, this will be a settings page.
      </p>
      <div>
        { servos.map((servo, index) => (
          <div key={index} className="flex"> 
            <ServoInput key={index} index={index} servo={servo} onChange={onServoChange} displayChannel displayMinMax displayName/>
            <Button color="primary" onClick={removeServo(index)} isDisabled={(servos.length < 1)}>Remove</Button>
            {/* <Button onClick={() => settingsContext.setServoSettings(servo as ServoSettings) }>Save</Button> */}
          </div>
        ))}
        <Button onClick={() => setServos([...servos, getNewNamedServo(servos.length)])}>Add Servo</Button>
      </div>
      <pre>
        {JSON.stringify(servos, null, 2)}
      </pre>
      <div className="flex gap-4">
      <DownloadButton title="Download Settings" icon={<DocumentArrowDownIcon />} includeTimestamp defaultFileName="servo-settings.json" generateBlob={generateSettingsBlob} />
      <Button disabled={true}>Load Settings</Button>
      </div>
    </main>
  );
}