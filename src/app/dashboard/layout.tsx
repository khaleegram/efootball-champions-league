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

  useEffect(() => {
    // If the auth state is resolved and there's no user, redirect to login.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  // While the auth state is loading, or if there is no user (which means a redirect is imminent),
  // show a loader. This prevents the dashboard from flashing on the screen for unauthenticated users.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If auth is resolved and there is a user, render the dashboard.
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
