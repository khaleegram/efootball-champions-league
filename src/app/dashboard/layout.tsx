
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth check is done and there's no user, they can't be here.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // While checking auth, or if there's no user (and we're about to redirect), show a loader.
  // This prevents content from flashing before the auth check is complete and the redirect happens.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user, render the full dashboard layout.
  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-muted/20">
            <DashboardSidebar />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                {children}
            </main>
        </div>
    </SidebarProvider>
  );
}
