import {NextUIProvider} from '@nextui-org/react'
import { SerialProvider } from "@/app/contexts/serial";


export function Providers({children}: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <SerialProvider>
        {children}
      </SerialProvider>
    </NextUIProvider>
  )
}