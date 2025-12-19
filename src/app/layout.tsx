import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EMIS XML SNOMED Analyser',
  description:
    'Analyse EMIS XML exports and expand SNOMED codes using terminology server',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider style={{ '--sidebar-width': '28rem' } as React.CSSProperties}>
          <AppSidebar />
          <SidebarInset className="flex flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
              <SidebarTrigger className="-ml-1" />
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
