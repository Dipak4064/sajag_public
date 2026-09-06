import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import BottomNav from '@/components/bottom-nav';

export const metadata: Metadata = {
  title: 'SAJAG (सजग) Citizen | Disaster Response & Early Warning',
  description: 'Community Early Warning, Safe Shelters and 1-Tap SOS for Kathmandu Valley Citizens',
  manifest: '/manifest.json',
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-red-500 selection:text-white pb-20">
        <Navbar />
        <main>{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
