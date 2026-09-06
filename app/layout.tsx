import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import BottomNav from '@/components/bottom-nav';
import PageTransition from '@/components/page-transition';

export const metadata: Metadata = {
  title: { default: 'SAJAG', template: '%s · SAJAG' },
  description: 'Community Early Warning, Safe Shelters and 1-Tap SOS for Kathmandu Valley Citizens',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#070b14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="aurora-bg min-h-screen pb-24 text-slate-100 antialiased selection:bg-cyan-400/30 selection:text-white">
        <Navbar />
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
