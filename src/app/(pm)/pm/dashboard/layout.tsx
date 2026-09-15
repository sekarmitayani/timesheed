import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PM Dashboard - Haerarchy',
};

export default function PmDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
