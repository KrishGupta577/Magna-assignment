import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { cookies } from 'next/headers';

export const GET = async () => {
    try {
        const session = await getServerSession(authOptions);

        const cookieStore = cookies();
        const sessionUserCookie = (await cookieStore).get('session-user'); 

        let userEmail: string | undefined = session?.user?.email;

        if (!userEmail && sessionUserCookie?.value) {
            const parsedCookie = JSON.parse(sessionUserCookie.value || '{}');
            userEmail = parsedCookie?.email;
        }

        if (!userEmail) {
            return Response.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const payload = await getPayload({ config: configPromise });

        // ✅ Find site-user by session email
        const userQuery = await payload.find({
            collection: 'site-users',
            where: { email: { equals: userEmail } },
            limit: 1,
        });

        const user = userQuery.docs[0];
        if (!user) return Response.json({ items: [] });

        // ✅ Fetch all cart items for this user
        const cartQuery = await payload.find({
            collection: 'cart',
            where: { user: { equals: user.id } },
            limit: 100,
        });

        const cartItems = cartQuery.docs || [];

        // ✅ Extract all product IDs in 1 go
        const productIds = cartItems
            .map((c: any) =>
                typeof c.product === 'object'
                    ? c.product.id || c.product._id
                    : c.product
            )
            .filter(Boolean);

        let productsById: Record<string, any> = {};
        if (productIds.length > 0) {
            const productQuery = await payload.find({
                collection: 'products',
                where: { id: { in: productIds } },
                limit: productIds.length,
            });

            productsById = productQuery.docs.reduce((acc: any, product: any) => {
                acc[product.id] = product;
                return acc;
            }, {});
        }

        // ✅ Final Clean Response Format
        const items = cartItems.map((c: any) => {
            const productRaw = c.product;
            const productId =
                typeof productRaw === 'object'
                    ? productRaw.id || productRaw._id
                    : productRaw;

            const product = productsById[productId] || null;

            return {
                productId,
                quantity: c.quantity,
                addedAt: c.addedAt,
                title: product?.productName || product?.title || 'Unknown Product',
                price: product?.price || 0,
                image: product?.image || null,
            };
        });

        return Response.json({ items }, { status: 200 });
    } catch (err: any) {
        console.error('GET /api/cart error:', err);
        return Response.json({ items: [] }, { status: 500 });
    }
};
