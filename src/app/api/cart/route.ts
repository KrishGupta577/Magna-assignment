import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ items: [] });
    }

    const payload = await getPayload({ config: configPromise });

    // ✅ Find site-user by session email
    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: session.user.email } },
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

    // ✅ Fetch product details in a single request
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
