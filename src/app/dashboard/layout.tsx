import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

async function verifySession() {
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error) {
    console.error('Invalid session cookie found, redirecting to login.', error);
    redirect('/login');
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await verifySession();

  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-background">
            <DashboardSidebar />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                {children}
            </main>
        </div>
    </SidebarProvider>
  );
}
