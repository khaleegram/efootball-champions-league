import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

// This is a server component that verifies the user's session before rendering the dashboard.
async function verifySession() {
  const sessionCookie = cookies().get('session')?.value;

  // If there's no session cookie, the middleware should have already redirected.
  // This is an extra layer of security.
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // Verify the session cookie with Firebase Admin.
    // The `true` argument checks for revocation.
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error) {
    console.error('Invalid session cookie found, redirecting to login.', error);
    // If verification fails, the cookie is invalid, so redirect to login.
    redirect('/login');
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure the user has a valid session before rendering anything in the dashboard.
  await verifySession();

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
