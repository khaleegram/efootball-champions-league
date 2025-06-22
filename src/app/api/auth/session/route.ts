import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// This route is responsible for creating and deleting the server-side session cookie.

/**
 * POST handler to create a session cookie.
 * The client-side will call this after a successful Firebase login.
 */
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ message: 'ID token is required.' }, { status: 400 });
  }

  // Session expires in 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Set the cookie on the response.
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

/**
 * DELETE handler to clear the session cookie.
 * The client-side will call this on logout.
 */
export async function DELETE(request: NextRequest) {
    try {
        // Clear the 'session' cookie.
        cookies().set('session', '', {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });
        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error deleting session cookie:', error);
        return NextResponse.json({ message: 'Failed to delete session' }, { status: 500 });
    }
}
