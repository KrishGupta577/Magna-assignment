import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const GET = async () => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return Response.json({ items: [] });

        const payload = await getPayload({ config: configPromise });
        const userQuery = await payload.find({ collection: 'site-users', where: { email: { equals: session.user.email } }, limit: 1 });
        const user = userQuery.docs[0];
        const cart = user?.cart || [];

        // Build items with product metadata when possible to avoid extra client requests
        const productIds = cart.map((it: any) => {
            const raw = it.product;
            return typeof raw === 'object' ? (raw?.id ?? raw?._id ?? raw) : raw;
        }).filter(Boolean);

        let productsById: Record<string, any> = {};
        if (productIds.length > 0) {
            // fetch product docs in one query
            const productsQuery = await payload.find({ collection: 'products', where: { id: { in: productIds } }, limit: productIds.length });
            const prods = productsQuery.docs || [];
            productsById = prods.reduce((acc: any, p: any) => {
                const id = p.id ?? p._id;
                acc[id] = p;
                return acc;
            }, {} as Record<string, any>);
        }

        const items = cart.map((it: any) => {
            const raw = it.product;
            const productId = typeof raw === 'object' ? (raw?.id ?? raw?._id ?? raw) : raw;
            const prod = productsById[productId] || null;
            const title = prod ? (prod.productName || prod.title || prod.name || prod.slug || productId) : productId;
            const image = prod ? (prod.image ?? null) : null;
            const price = prod ? (prod.price ?? null) : null;
            return { productId, quantity: it.quantity, title, image, price };
        });

        return Response.json({ items });
    } catch (err: any) {
        console.error('GET /api/cart error:', err);
        return Response.json({ items: [] }, { status: 500 });
    }
};
