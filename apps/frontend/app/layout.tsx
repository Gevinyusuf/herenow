import type { Metadata } from 'next';
import { Lalezar } from 'next/font/google';
import './globals.css';

const lalezar = Lalezar({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lalezar',
});

export const metadata: Metadata = {
  title: 'HereNow - AI-Powered Event Intelligence Platform',
  description: 'HereNow is the intelligent, AI-powered platform for event socialization and management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`antialiased ${lalezar.variable}`}>{children}</body>
    </html>
  );
}

