import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HereNow - AI-Powered Event Intelligence Platform',
  description: 'HereNow is the intelligent, AI-powered platform for event socialization and management. Create your digital identity instantly and let AI connect you with the right people and opportunities.',
  keywords: ['event management', 'AI events', 'networking', 'event platform', 'digital business cards', 'event intelligence'],
  authors: [{ name: 'HereNow Events Inc.' }],
  openGraph: {
    title: 'HereNow - AI-Powered Event Intelligence Platform',
    description: 'Make Every Encounter Count. Join the future of event networking.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HereNow - AI-Powered Event Intelligence Platform',
    description: 'Make Every Encounter Count. Join the future of event networking.',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#FF6B3D',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
