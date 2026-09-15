import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Haerarchy',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
