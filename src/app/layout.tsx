import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Haerarchy – Enterprise Project Management",
  description: "AI-Powered Project & Workforce Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
