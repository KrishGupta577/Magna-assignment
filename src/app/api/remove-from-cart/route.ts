import { NextResponse } from 'next/server';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
    try {
        const { productId } = await req.json();
        if (!productId) {
            return NextResponse.json({ error: 'productId required' }, { status: 400 });
        }

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
        const payload = await getPayload({
            config: await configPromise,
        });

        const userQuery = await (payload as any).find({ collection: 'site-users', where: { email: { equals: userEmail } }, limit: 1 });
        const user = userQuery.docs[0];
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // find cart item for this user+product
        const cartQuery = await (payload as any).find({ collection: 'cart', where: { user: { equals: user.id }, product: { equals: productId } }, limit: 1 });
        const cartItem = cartQuery.docs[0];

        if (!cartItem) {
            // nothing to remove
            return NextResponse.json({ items: [] }, { status: 200 });
        }

        if ((cartItem.quantity || 0) > 1) {
            await (payload as any).update({ collection: 'cart', id: cartItem.id, data: { quantity: (cartItem.quantity || 0) - 1 }, overrideAccess: true });
        } else {
            await (payload as any).delete({ collection: 'cart', id: cartItem.id, overrideAccess: true });
        }

        const remaining = await (payload as any).find({ collection: 'cart', where: { user: { equals: user.id } }, limit: 100 });
        const items = (remaining.docs || []).map((item: any) => {
            const raw = item.product;
            const id = typeof raw === 'object' ? raw.id || raw._id : raw;
            return { productId: id, quantity: item.quantity };
        });

        return NextResponse.json({ items }, { status: 200 });

    } catch (err) {
        console.error('remove-from-cart error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
};
