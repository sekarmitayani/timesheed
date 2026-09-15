import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Management Dashboard - Haerarchy',
};

export default function ManagementDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
