import { Select, SelectItem } from "@nextui-org/react";
import { useContext, useEffect, useState } from "react";
import { ServoWithName } from "../types";
import SettingsContext from "../contexts/settings";


type SavedServoSettingsPickerProps = {
  onSavedServoSettingsSelect: (servoSettings: ServoWithName) => void;
}

export default function SavedServoSettingsPicker(props: SavedServoSettingsPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [savedServoSettingsSelectValue, setSavedServoSettingsSelectValue] = useState<string>("");
  const settingsContext = useContext(SettingsContext);

  useEffect(() => { // little lifecycle hook so we match the SSR client state
    console.log('servo settings picker mounted');
    setIsClient(true);

    return () => {
      console.log('servo  settings picker  unmounted');
      setIsClient(false); // cleanup
    }
  }, []); // run once on mount

  const servoSettingsNamesCollection = isClient ? 
    settingsContext.getDefinedServoNames().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).map((item) => 
      <SelectItem key={item as string} textValue={item as string} value={item as string}>{item as string}</SelectItem>)
    :
    <SelectItem key='default' textValue="default" value='default'>Client state not loaded yet.</SelectItem>;
  
  const handleSavedServoSettingsSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`Saved servo settings select change to ${e.target.value}`);
    console.log(`Loading saved settings for ${JSON.stringify(e.target.value)}`);
    const selectedValue = e.target.value;
    const servoSettings = settingsContext.getServoSettings(selectedValue) as ServoWithName;
    if (servoSettings) {
      if (props.onSavedServoSettingsSelect && (typeof props.onSavedServoSettingsSelect === 'function')) {
        props.onSavedServoSettingsSelect(servoSettings);
      } else {
        console.error('No onSavedServoSettingsSelect function provided');
      }
    } else {
      console.error(`No servo settings found for ${selectedValue}`);
    }


    // setServos([...servos, servoSettings]);
    
    
    
    setSavedServoSettingsSelectValue(e.target.value);
  }

  if (savedServoSettingsSelectValue !== "") {
    setSavedServoSettingsSelectValue("");
  }

  return (
    <Select 
      aria-label="Pick a saved servo settings to load"
      variant="bordered"
      placeholder="Select a saved servo settings"
      className="max-w-xs"
      onChange={handleSavedServoSettingsSelectChange}
      selectedKeys={[savedServoSettingsSelectValue]}
    >
      {servoSettingsNamesCollection}
    </Select>
  )
}