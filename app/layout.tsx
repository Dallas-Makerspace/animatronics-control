import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SideNav from '@/app/components/ui/sidenav';
import {Providers} from "./providers";

 
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DMS Animatronics Control",
  description: "Created with ❤️ at Dallas Makerspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
              <SideNav />
            </div>
            <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
          </div>
        </Providers>
        {/* <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          
        </div> */}
      </body>
    </html>
  );
}
