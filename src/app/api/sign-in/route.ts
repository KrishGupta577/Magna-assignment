import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const payload = await getPayload({ config: configPromise });

    // ✅ Await cookies() before using delete()
    const cookieStore = await cookies();
    cookieStore.delete('session-user');
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('next-auth.callback-url');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('payload-token');

    // ✅ Login with Payload CMS
    const { user } = await payload.login({
      collection: 'site-users',
      data: { email, password },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // ✅ Session data
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.username || user.email,
    };

    // ✅ Set new cookie
    const response = NextResponse.json(
      { message: 'Login successful', user: sessionData },
      { status: 200 }
    );

    response.cookies.set('session-user', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
};
