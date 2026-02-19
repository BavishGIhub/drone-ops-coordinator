import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skylark Drones Operations Coordinator',
  description: 'AI-powered drone fleet operations management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
