'use client';
import { useContext } from 'react';
import SerialContext, {SerialContextType} from '../contexts/serial';
import { HandRaisedIcon, SignalSlashIcon, SignalIcon } from '@heroicons/react/24/outline';


function formatPortInfo(info: SerialPortInfo) {
  if (!info || !info.usbVendorId) {
    return 'Port with no info';
  }
  return `Vendor ID: ${info.usbVendorId} - Product ID: ${info.usbProductId}`;
}

export default function SerialStatus() {
  const serialContext = useContext(SerialContext);
  let StatusIcon = HandRaisedIcon;
  let statusText = 'No Web Serial support';

  const { hasWebSerial, connected } = serialContext;

  const onClick = async () => {
    console.log('ADAM: SerialStatus onClick');
    if (hasWebSerial) {
      if (connected) {
        console.log('ADAM: Trying to disconnect serial port');
        serialContext.disconnect();
      } else {
        const baudRate = 115200;
        const serialOptions = {
          baudRate,
        };
        const port: SerialPort = await (navigator as any).serial.requestPort();
        console.log("Port selected", port);
        await port.open(serialOptions);
        console.log(`Port opened at ${baudRate}`, formatPortInfo(port.getInfo()));
        const readable = port.readable;
        if (!readable) {
          throw new Error('Port not readable');
        }
        const reader = port.readable.getReader();
        const writable = port.writable;
        if (!writable) {
          throw new Error('Port not writable');
        }
        const writer = port.writable.getWriter();

        serialContext.setWriter(writer);
        serialContext.setReader(reader);
        serialContext.setConnected(true);
        const disconnectFunction = async () => {
          console.log('ADAM: Disconnecting serial port');
          if (reader) {
            console.log('ADAM: Cancelling reader');
            await reader.cancel();
            console.log('ADAM: Setting reader to null');
            serialContext.setReader(null);
          }
          if (writer) {
            console.log('ADAM: Releasing writer lock');
            await writer.releaseLock();
            console.log('ADAM: Setting writer to null');
            serialContext.setWriter(null);
          }
          console.log('ADAM: Closing port');
          await port.close();
          console.log('ADAM: Setting connected to false');
          serialContext.setConnected(false);
        }

        // TODO: Why is this calling the disconnectFunction and not just registering it? 
        serialContext.setDisconnect(() => disconnectFunction);

        port.addEventListener('readerror', (event) => {
          console.error('Serial port read error', event);
        });
        port.addEventListener('writeerror', (event) => {
          console.error('Serial port write error', event);
        });
        port.addEventListener('disconnect', (event) => {
          console.log('Serial port disconnected', event);
          serialContext.setConnected(false);
        });
      }
    }
  }

  if (!serialContext.hasWebSerial) {
    StatusIcon = HandRaisedIcon;
    statusText = 'No Web Serial support';
  } else if (serialContext.connected) {
    StatusIcon = SignalIcon;
    statusText = 'Connected';
  } else {
    StatusIcon = SignalSlashIcon;
    statusText = 'Not connected';
  }
  return (
    <div
      className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
      onClick={onClick}
    >
      <StatusIcon className="w-6" />
      <p className="hidden md:block">{statusText}</p>
    </div>
  );
}
