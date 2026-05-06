'use client';

import Link, { type LinkProps } from 'next/link';
import { useAuth, useRequireRoles } from '@hospigrow/auth';
import { Button } from '@hospigrow/ui';
import { CalendarHeart, FileText, Home, Receipt } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { authorized } = useRequireRoles(['patient']);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-ink-500">Redirecting to sign-in…</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl text-ink-900">Patients only</h1>
          <p className="mt-3 text-ink-500">
            This space is for patients. Staff can sign in to the staff workspace.
          </p>
          <Button className="mt-6" variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between gap-6 px-4 md:px-6">
          <Link href="/" className="font-display text-xl text-ink-900 tracking-tight">
            Hospigrow
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-screen-md px-4 py-8 md:px-6 md:py-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-ink-200 bg-white md:hidden"
        aria-label="Primary"
      >
        <BottomLink href="/" icon={<Home className="h-5 w-5" />} label="Home" />
        <BottomLink
          href="/appointments"
          icon={<CalendarHeart className="h-5 w-5" />}
          label="Visits"
        />
        <BottomLink
          href="/records"
          icon={<FileText className="h-5 w-5" />}
          label="Records"
        />
        <BottomLink
          href="/bills"
          icon={<Receipt className="h-5 w-5" />}
          label="Bills"
        />
      </nav>
    </div>
  );
}

function BottomLink({
  href,
  icon,
  label,
}: {
  href: LinkProps['href'];
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-2 text-ink-600 hover:text-primary-600"
    >
      {icon}
      <span className="text-2xs uppercase tracking-wider">{label}</span>
    </Link>
  );
}
