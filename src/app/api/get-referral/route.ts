import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { cookies } from 'next/headers';

export const GET = async () => {
  try {
      const session = await getServerSession(authOptions);

    const cookieStore = cookies();
    const sessionUserCookie = (await cookieStore).get('session-user'); // custom cookie for guest

    let userEmail: string | undefined = session?.user?.email;

    if (!userEmail && sessionUserCookie?.value) {
      const parsedCookie = JSON.parse(sessionUserCookie.value || '{}');
      userEmail = parsedCookie?.email;
    }

    if (!userEmail) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await getPayload({ config: configPromise });
    const userQuery = await payload.find({ collection: 'site-users', where: { email: { equals: userEmail } }, limit: 1 });
    const user = userQuery.docs[0];

    if (!user) return Response.json({ referralCode: null }, { status: 404 });

    return Response.json({ referralCode: user.referralCode || null });
  } catch (err: any) {
    console.error('GET /api/get-referral error:', err);
    return Response.json({ referralCode: null }, { status: 500 });
  }
};
