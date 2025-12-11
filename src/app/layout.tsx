import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { UserProvider } from '@/providers/UserProvider';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const outfit = Outfit({ 
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Team CRM',
  description: 'Персональная CRM-система для управления заказами',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans bg-[#0a0a0f] text-gray-100 antialiased`}>
        <QueryProvider>
          <WebSocketProvider>
            <UserProvider>
              <ToastProvider>{children}</ToastProvider>
            </UserProvider>
          </WebSocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
