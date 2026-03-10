// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scissors™ Men\'s Beauty Lounge | Bhatkal',
  description: 'Book your premium grooming appointment at Scissors Men\'s Beauty Lounge, Bhatkal. 2 branches, expert barbers, instant confirmation.',
  keywords: 'scissors salon bhatkal, men grooming bhatkal, haircut bhatkal, beard trim bhatkal, beauty lounge karnataka',
  openGraph: {
    title: "Scissors™ Men's Beauty Lounge",
    description: 'Premium men\'s grooming in Bhatkal. Book online in seconds.',
    siteName: "Scissors Men's Beauty Lounge",
    locale: 'en_IN',
    type: 'website',
  },
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        <div style={{ background: '#000', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
          <main style={{ width: '100%', maxWidth: '440px', minHeight: '100vh', background: '#000', position: 'relative', overflowX: 'hidden' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
