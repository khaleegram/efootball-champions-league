import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ message: 'ID token is required.' }, { status: 400 });
  }

  if (!adminAuth) {
    return NextResponse.json({ message: 'Firebase Admin not initialized.' }, { status: 500 });
  }

  // 5 days
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
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

export async function DELETE(request: NextRequest) {
    try {
        cookies().delete('session');
        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error deleting session cookie:', error);
        return NextResponse.json({ message: 'Failed to delete session' }, { status: 500 });
    }
}
