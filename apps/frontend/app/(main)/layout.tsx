import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HereNow - Your Event Records',
  description: 'Record every amazing moment you\'ve been a part of.',
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

