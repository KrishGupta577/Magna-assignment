import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const GET = async () => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return Response.json({ items: [] }, { status: 401 });
        }

        const payload = await getPayload({ config: configPromise });

        const userQuery = await payload.find({
            collection: 'site-users',
            where: { email: { equals: session.user.email } },
            limit: 1,
        });

        const user = userQuery.docs[0];
        const wishlist = user?.wishlist || [];

        if (!Array.isArray(wishlist) || wishlist.length === 0) {
            return Response.json({ items: [] });
        }

        // ✅ Extract only valid product IDs (string/number)
        const wishlistIds = wishlist.map((item: any) => {
            if (typeof item === 'string' || typeof item === 'number') return item;
            if (typeof item === 'object') {
                return item?.id || item?._id || item.product || null;
            }
            return null;
        }).filter(Boolean);

        if (wishlistIds.length === 0) {
            return Response.json({ items: [] });
        }

        // ✅ Fetch only by product IDs
        const productsQuery = await payload.find({
            collection: 'products',
            where: { id: { in: wishlistIds } },
            limit: wishlistIds.length,
        });

        const products = productsQuery.docs || [];

        // ✅ Map to clean response
        const items = products.map((p: any) => ({
            id: p.id,
            title: p.title || p.productName || p.slug || p.id,
            price: p.price,
            image: p.image,
        }));

        return Response.json({ items });
    } catch (err: any) {
        console.error('GET /api/wishlist error:', err);
        return Response.json({ items: [] }, { status: 500 });
    }
};
