'use client';

import React, { createContext, useEffect, useState } from 'react';
import { ServoSettings } from '../types';
import { jsonToMap, mapToJson } from '../utils/general';
const verboseDebug = false;

/** Prefix applied to local storage keys */
const localStorageKey = 'dmsAnimatronics';

/**
 * The context for the application settings.
 */
export interface SettingsContextType {
  definedServoNames: String[];
  getDefinedServoNames: () => String[];
  getServoSettings: (servoName: string) => ServoSettings;
  setServoSettings: (settings: ServoSettings) => void;
  removeServoSettings: (name: string) => void;
  saveSettingsToLocalStorage: () => void;
}

const defaultServoSettings = (servoName: string): ServoSettings => {
  return {
    name: servoName,
    minPulse: 500,
    maxPulse: 2500,
    channel: -1
  }
}

/**
 * The default context for Settings. This is used as a "fallback" when the context is not provided.
 */
const defaultSettingsContext: SettingsContextType = {
  definedServoNames: [],
  getDefinedServoNames: () => {
    throw new Error('Settings context not provided before calling getRawSettings');
  },
  getServoSettings: (_: string) => {
    throw new Error('Settings context not provided before calling getServoSettings');  
  },
  setServoSettings: (_: ServoSettings) => {
    throw new Error('Settings context not provided before calling setServoSettings');
  },
  removeServoSettings: (_: string) => {
    throw new Error('Settings context not provided before calling removeServoSettings');
  },
  saveSettingsToLocalStorage: () => {
    throw new Error('Settings context not provided before calling saveSettingsToLocalStorage');
  }
};

/**
 * The context for the application settings.
 */
const SettingsContext = createContext<SettingsContextType>(defaultSettingsContext);

/**
 * A provider for the SettingsContext.
 * @param children The children to render.
 * @returns The provider for the SettingsContext, with the children rendered inside.
 */
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [servoSettingsNames, setServoSettingsNames] = useState<string[]>([]);

  /**
   * Get the initial state of the servo settings from local storage.
   * @returns The initial state of the servo settings.
   */
  const getInitialServoSettings = (): Map<string, ServoSettings> => {
    const servoSettings = (typeof window !== 'undefined') ?
      localStorage ? localStorage.getItem(`${localStorageKey}-servoSettings`) : null
      : null // if window is not defined, return null
    if (servoSettings) {
      setInitialized(true);
      return jsonToMap(servoSettings);
    } else {
      return new Map<string, ServoSettings>();
    }
  }
  
  const [servoSettings, setServoSettingsState] = useState<Map<string, ServoSettings>>(getInitialServoSettings);
  
  useEffect(() => {
    if (!initialized) {
      console.log('Initializing servo settings from local storage in SettingsProvider useEffect');
      const servoSettingsJSON = localStorage.getItem(`${localStorageKey}-servoSettings`);
      if (servoSettingsJSON) {
        const servoSettingsMap = jsonToMap(servoSettingsJSON);
        setServoSettingsState(servoSettingsMap);
        setServoSettingsNames(Array.from(servoSettingsMap.keys()));
      }
      setInitialized(true);
    }
  }, [initialized]);

  const saveSettingsToLocalStorage = () => {
    // TODO: This keeps properties that are not part of the interface in the output. Is that a problem?
    const servoSettingsJSON = mapToJson(servoSettings);
    localStorage.setItem(`${localStorageKey}-servoSettings`, servoSettingsJSON);
    console.log('Saved all servo settings to local storage');
    setServoSettingsState(new Map(servoSettings)); // trigger a re-render by changing the state (compared by reference)    
  }

  const myContext: SettingsContextType = {
    definedServoNames: servoSettingsNames,
    getDefinedServoNames: () => {
      return Array.from(servoSettings.keys());
    },
    getServoSettings: (servoName: string): ServoSettings => {
      const settings = servoSettings.get(servoName);
      if (!settings) {
        console.error(`No settings found for servo ${servoName} using default settings`);
        servoSettings.set(servoName, defaultServoSettings(servoName))
        const newSettings = servoSettings.get(servoName);
        if (!newSettings || newSettings == undefined || newSettings.name !== servoName ) {
          throw new Error('Unable to get new settings after setting default settings');
        } else {
          return newSettings;
        }
      }
      return settings;
    },
    setServoSettings: (settings: ServoSettings) => {
      verboseDebug && console.log(`Setting servo settings for ${settings.name}`);
      servoSettings.set(settings.name, settings);
      saveSettingsToLocalStorage();
      verboseDebug && console.log(`Servo settings for ${settings.name} set to ${JSON.stringify(settings)}`);
    },
    removeServoSettings: (name: string) => {
      verboseDebug && console.log(`Removing servo settings for ${name}`);
      servoSettings.delete(name);
      saveSettingsToLocalStorage();
    },
    saveSettingsToLocalStorage
  };

  // useEffect(() => {
  //   console.log('Saving servo settings to local storage in SettingsProvider useEffect');
  //   const servoSettingsJSON = mapToJson(servoSettings);
  //   // TODO: This keeps properties that are not part of the interface in the output. Is that a problem?
  //   localStorage.setItem(`${localStorageKey}-servoSettings`, servoSettingsJSON);
  //   console.log('Saved servo settings to local storage');
  //   console.log(`Servo settings: ${servoSettingsJSON}`);
  // }, [servoSettings]);

  return (
    <SettingsContext.Provider value={myContext}>
      {children}
    </SettingsContext.Provider>
  );
};


export default SettingsContext;