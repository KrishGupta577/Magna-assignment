import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

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
    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: userEmail } },
      limit: 1,
    });

    const user = userQuery.docs[0];

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const result = {
      email: user.email,
      referralCode: user.referralCode ?? null,
      referralPoints: user.referralPoints ?? 0,
      referralUsed: !!user.referralUsed,
    };

    return Response.json(result);
  } catch (err: any) {
    console.error('❌ GET /api/user error:', err);
    return Response.json({ error: 'Server Error' }, { status: 500 });
  }
};
