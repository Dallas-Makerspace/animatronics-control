'use client';

import { useContext, ReactNode } from 'react';
import SerialContext from "../contexts/serial";

export type WebSerialConditionalProps = {
  children: ReactNode;
  getStartedMessage?: string;
};

/**
 * A component that conditionally renders its children based on the Web Serial API support.
 * 
 * If the Web Serial API is supported, but not connected, a message is displayed to the user encouraging them to connect.
 * If the Web Serial API is not supported, a message is displayed to the user about using a Web Serial compatible browser.
 * 
 * @param children The children to render if the Web Serial API is supported.
 * @param getStartedMessage The message to display if the Web Serial API is supported but not connected.
 */
export default function WebSerialConditional(props: WebSerialConditionalProps) {
  const serialContext = useContext(SerialContext);
  const { getStartedMessage } = props.getStartedMessage ? props : {getStartedMessage: 'to get started'};

  return serialContext.hasWebSerial ?
  // if Web Serial is supported
  serialContext.connected ? props.children : 
  ( // Web Serial is supported but not connected
    <div>Please connect to a servo controller on the left (click on &quot;Not Connected&quot;) {getStartedMessage}</div>
  ) : ( // below is rendered if Web Serial is not supported
    <div id="notSupported">
      Sorry, <b>Web Serial</b> is not supported on this device, make sure you&apos;re running
      Chrome 78 or later and have enabled the <code>#enable-experimental-web-platform-features</code>
      &nbsp;flag in <code>chrome://flags</code>
    </div>
  );
}