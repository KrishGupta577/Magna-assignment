import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const POST = async (req: Request) => {
    try {
        const { productId } = await req.json();
        if (!productId) return Response.json({ error: 'productId required' }, { status: 400 });

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

        const payload = await getPayload({ config: configPromise });
        const userQuery = await payload.find({ collection: 'site-users', where: { email: { equals: session.user.email } }, limit: 1 });
        const user = userQuery.docs[0];
        if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

        const wishlist = user.wishlist || [];
        const updated = (Array.isArray(wishlist) ? wishlist : []).filter((id: any) => id !== productId);

        const updatedUser = await payload.update({ collection: 'site-users', id: user.id, data: { wishlist: updated } });

        return Response.json({ wishlist: updatedUser.wishlist || [] });
    } catch (err: any) {
        console.error('remove-from-wishlist error:', err);
        return Response.json({ error: 'Server Error' }, { status: 500 });
    }
};
