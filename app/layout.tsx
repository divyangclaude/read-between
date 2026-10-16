import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'READ BETWEEN — Hair care, decoded.',
  description: 'Look beyond the bottle. Understand your hair-care ingredients and make a more informed choice.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
