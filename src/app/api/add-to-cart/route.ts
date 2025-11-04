import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const productId = body.productId;

    if (!productId) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Session validation
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await getPayload({ config: configPromise });

    // Get logged in user
    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    const user = userQuery.docs[0];
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Validate product exists
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
    });

    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    // Quantity (if sent negative: remove/decrease)
    const delta = typeof body.quantity === 'number' ? body.quantity : 1;

    // Check if item is already in cart
    const existingQuery = await payload.find({
      collection: 'cart',
      where: {
        user: { equals: user.id },
        product: { equals: product.id },
      },
      limit: 1,
    });

    const existing = existingQuery.docs[0];

    if (existing) {
      const newQty = (existing.quantity || 0) + delta;

      if (newQty > 0) {
        await payload.update({
          collection: 'cart',
          id: existing.id,
          data: { quantity: newQty },
          overrideAccess: true,
        });
      } else {
        await payload.delete({
          collection: 'cart',
          id: existing.id,
          overrideAccess: true,
        });
      }
    } else if (delta > 0) {
      // ✅ FIXED — ensure product ID is correct
      await payload.create({
        collection: 'cart',
        data: {
          user: user.id,
          product: product.id, // always valid ID
          quantity: delta,
          addedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      });
    }

    // ✅ Return updated cart
    const cartQuery = await payload.find({
      collection: 'cart',
      where: { user: { equals: user.id } },
      limit: 100,
    });

    const cartItems = cartQuery.docs;

    // Map clean data
    const items = cartItems.map((c: any) => ({
      productId: typeof c.product === 'object' ? c.product.id : c.product,
      quantity: c.quantity,
      addedAt: c.addedAt,
    }));

    return Response.json({ items }, { status: 200 });
  } catch (error: any) {
    console.error('Add to cart error:', error);
    return Response.json(
      { error: error.message || 'Failed to add to cart' },
      { status: 500 }
    );
  }
};
