import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionExpiryDialog } from "@/components/layout/SessionExpiryDialog";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import QueryProvider from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "Haerarchy",
  description: "AI-Powered Project & Workforce Management System",
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    title: "Haerarchy",
    description: "AI-Powered Project & Workforce Management System",
    url: "https://haerarchy.com",
    siteName: "Haerarchy",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Haerarchy Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:wght@500&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-sans antialiased custom-scrollbar`}>
        <TopProgressBar />
        <QueryProvider>
          {children}
        </QueryProvider>
        <SessionExpiryDialog />
        <Toaster />
      </body>
    </html>
  );
}

