import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

async function verifySession() {
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionCookie) {
    return null;
  }
  
  if (!adminAuth) {
    console.error("Firebase Admin not initialized, cannot verify session.");
    // This might be a temporary state during hot-reload, but it's a critical failure.
    // In a production scenario, you might want to handle this more gracefully.
    return null;
  }

  try {
    // Verify the session cookie.
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error) {
    console.error('Invalid session cookie found, clearing it.', error);
    // Session cookie is invalid, clear it.
    cookies().delete('session');
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const decodedToken = await verifySession();

  if (!decodedToken) {
    redirect('/login');
  }

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
