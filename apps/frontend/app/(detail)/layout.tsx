import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HereNow - Event Details',
  description: 'View event details and join the community.',
};

export default function DetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

