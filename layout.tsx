import type { Metadata, Viewport } from 'next';
import { SkipToContent } from '@hospigrow/ui';
import { Providers } from './providers';
import { AppShell } from '../components/app-shell';
import '@hospigrow/ui/styles.css';

export const metadata: Metadata = {
  title: 'Hospigrow — Your health',
  description: 'Your appointments, records, and bills, all in one place.',
};

export const viewport: Viewport = {
  themeColor: '#f7f6f3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SkipToContent />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
