import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

export const metadata: Metadata = {
  title: 'Yasinflex - Watch Free Movies & TV Shows Online',
  description: 'Watch free movies and TV shows online in HD quality. No ads, no registration required.',
  keywords: 'watch free movies, free movies online, watch tv shows, streaming, yasinflex',
  robots: 'index, follow',
  openGraph: {
    title: 'Yasinflex - Watch Free Movies & TV Shows Online',
    description: 'Watch free movies and TV shows online in HD quality.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
