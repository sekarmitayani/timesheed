import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionExpiryDialog } from "@/components/layout/SessionExpiryDialog";
import QueryProvider from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "Haerarchy – Enterprise Project Management",
  description: "AI-Powered Project & Workforce Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:wght@500&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-sans antialiased custom-scrollbar overflow-x-hidden`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <SessionExpiryDialog />
        <Toaster />
      </body>
    </html>
  );
}

