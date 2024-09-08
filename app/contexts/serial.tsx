'use client';

import React, { createContext, useEffect, useState } from 'react';

export interface SerialContextType {
  /**
   * Whether the browser supports the Web Serial API.
   */
  hasWebSerial: boolean;
  /**
   * Whether the serial port is connected.
   */
  connected: boolean;
  /**
   * The writer for the serial port.
   */
  writer: WritableStreamDefaultWriter<any> | null;
  /**
   * The reader for the serial port.
   */
  reader: ReadableStreamDefaultReader<any> | null;
  /**
   * Set whether the browser supports the Web Serial API.
   * @param hasWebSerial Whether the browser supports the Web Serial API.
   * @returns void
   */
  setHasWebSerial: (hasWebSerial: boolean) => void;
  /**
   * Set whether the serial port is connected.
   * @param connected Whether the serial port is connected.
   * @returns void
   */
  setConnected: (connected: boolean) => void;
  /**
   * Set the writer for the serial port.
   * @param writer The writer for the serial port.
   * @returns void
   */
  setWriter: (writer: WritableStreamDefaultWriter<any> | null) => void;
  /**
   * Set the reader for the serial port.
   * @param reader The reader for the serial port.
   * @returns 
   */
  setReader: (reader: ReadableStreamDefaultReader<any> | null) => void;
  /**
   * Disconnect the serial port.
   */
  disconnect: () => void;
  /**
   * Set the disconnect function.
   * @param disconnect The disconnect function.
   * @returns void
   */
  setDisconnect: (disconnect: () => void) => void;
}

/**
 * The default context for the Serial port. This is used as a "fallback" when the context is not provided.
 */
const defaultSerialContext: SerialContextType = {
  hasWebSerial: false,
  connected: false,
  writer: null,
  reader: null,
  setHasWebSerial: () => { throw new Error('setHasWebSerial() not implemented without context'); },
  setConnected: () => { throw new Error('setConnected() not implemented without context'); },
  setWriter: () => { throw new Error('setWriter() not implemented without context'); },
  setReader: () => { throw new Error('setReader() not implemented without context'); },
  disconnect: () => { throw new Error('disconnect() not implemented without context'); },
  setDisconnect: () => { throw new Error('setDisconnect() not implemented without context'); }  
};

/**
 * The context for the Serial port.
 */
const SerialContext = createContext<SerialContextType>(defaultSerialContext);

/**
 * A provider for the SerialContext.
 * @param children The children to render.
 * @returns The provider for the SerialContext.
 */
export const SerialProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasWebSerial, setHasWebSerial] = useState(false);
  const [connected, setConnected] = useState(false);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter<any> | null>(null);
  const [reader, setReader] = useState<ReadableStreamDefaultReader<any> | null>(null);
  const defaultDisconnect = () => {
    console.error('Using default disconnect() this is most likely a bug');
    if (reader) {
      reader.cancel();
      setReader(null);
    }
    if (writer) {
      writer.releaseLock();
      setWriter(null);
    }
    setConnected(false);
  }
  const [disconnect, setDisconnect] = useState(() => defaultDisconnect);
  const myContext: SerialContextType = {
    hasWebSerial,
    connected,
    writer,
    reader,
    setHasWebSerial,
    setConnected,
    setWriter,
    setReader,
    disconnect,
    setDisconnect
  };
  useEffect(() => {
    console.log("ADAM: SerialProvider useEffect");
    if ("serial" in navigator) {
      console.log("ADAM: SerialProvider useEffect hasWebSerial");
      setHasWebSerial(true);
    } else {
      console.log("ADAM: SerialProvider useEffect noWebSerial");
    }
  }, []);


  return (
    <SerialContext.Provider value={myContext}>
      {children}
    </SerialContext.Provider>
  );
};


export default SerialContext;