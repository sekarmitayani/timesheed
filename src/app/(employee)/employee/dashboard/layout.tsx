import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Dashboard - Haerarchy',
};

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
