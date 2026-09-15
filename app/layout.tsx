import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'TrendPulse Daily', template: '%s | TrendPulse Daily' },
  description: 'AI, technology, business, India and world trends explained clearly every day.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
