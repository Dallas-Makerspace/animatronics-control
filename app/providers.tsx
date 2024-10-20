import {NextUIProvider} from '@nextui-org/react'
import { SerialProvider } from "@/app/contexts/serial";
import { SettingsProvider } from './contexts/settings';


export function Providers({children}: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <SettingsProvider>
        <SerialProvider>
          {children}
        </SerialProvider>
      </SettingsProvider>
    </NextUIProvider>
  )
}