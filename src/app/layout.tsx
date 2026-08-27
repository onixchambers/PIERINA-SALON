import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SalonProvider } from '@/context/SalonContext';
import NotificationBanner from '@/components/NotificationBanner';

export const metadata: Metadata = {
  title: 'Pierina Salón | Cejas, Pestañas y Más - Citas en Línea',
  description: 'Salón de belleza y estética especializado en cejas, pestañas, uñas, faciales y masajes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pierina Salón',
  },
  icons: {
    icon: '/logo-pierina.png',
    apple: '/logo-pierina.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#B85D75',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#FAF6F0] text-[#2D2424] antialiased selection:bg-[#B85D75]/20 selection:text-[#B85D75]">
        <SalonProvider>
          {children}
          <NotificationBanner />
        </SalonProvider>
      </body>
    </html>
  );
}
