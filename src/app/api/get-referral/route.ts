import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ referralCode: null }, { status: 401 });

    const payload = await getPayload({ config: configPromise });
    const userQuery = await payload.find({ collection: 'site-users', where: { email: { equals: session.user.email } }, limit: 1 });
    const user = userQuery.docs[0];

    if (!user) return Response.json({ referralCode: null }, { status: 404 });

    return Response.json({ referralCode: user.referralCode || null });
  } catch (err: any) {
    console.error('GET /api/get-referral error:', err);
    return Response.json({ referralCode: null }, { status: 500 });
  }
};
