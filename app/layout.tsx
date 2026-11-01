import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Weather Edge | Private Kalshi Radar',description:'Weather-only flow surveillance and paper performance validation.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
