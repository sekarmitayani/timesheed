import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Haerarchy',
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
