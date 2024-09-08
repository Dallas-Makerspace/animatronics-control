'use client';

// import { ThemeProvider } from 'acme-theme';
// import { AuthProvider } from 'acme-auth';

// export function Providers({ children }) {
//   return (
//     <ThemeProvider>
//       <AuthProvider>{children}</AuthProvider>
//     </ThemeProvider>
//   );
// }

import { SerialProvider } from '../contexts/serial';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SerialProvider>{children}</SerialProvider>
  );
}