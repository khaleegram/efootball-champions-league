// app/dashboard/layout.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Wait for the auth state to be resolved
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If auth is resolved and there is no user, redirect to login page.
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);
  

  // If there is a user, render the dashboard.
  if (user) {
    return (
      <SidebarProvider>
          <div className="flex">
              <DashboardSidebar />
              <main className="flex-1 p-4 md:p-8">
                  {children}
              </main>
          </div>
      </SidebarProvider>
    )
  }

  // If there is no user, a loader is shown while the redirect is in progress.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
