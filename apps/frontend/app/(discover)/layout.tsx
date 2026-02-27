import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover - HereNow',
  description: 'Discover amazing events and communities around you. Find where you belong.',
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

