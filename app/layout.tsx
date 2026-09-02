import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cube Timer',
  description: 'A focused 3×3 Rubik’s Cube scramble and timer.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
