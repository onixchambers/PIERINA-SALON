import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SalonProvider } from '@/context/SalonContext';
import NotificationBanner from '@/components/NotificationBanner';

export const metadata: Metadata = {
  title: 'Pierina Salón | Cejas, Pestañas y Más - Citas en Línea',
  description: 'Pierina Salón - Salón de belleza y estética especializado en cejas, pestañas, uñas, faciales y masajes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pierina Salón',
  },
  icons: {
    icon: '/logo-pierina.png',
    shortcut: '/logo-pierina.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#B85D75',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo-pierina.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Pierina Salón" />
        <meta name="application-name" content="Pierina Salón" />
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
