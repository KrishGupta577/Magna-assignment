import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export const POST = async (request: Request) => {
  try {
    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const payload = await getPayload({ config: await configPromise });

    const product = await payload.findByID({
      collection: 'products',
      id: productId,
    });

    if (!product) {
      return Response.json({ message: 'Product not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    const user = userQuery.docs[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const cart = user.cart || [];

    const existingItem = cart.find((item: any) => {
      const id =
        typeof item.product === 'object'
          ? item.product?.id || item.product?._id
          : item.product;
      return String(id) === String(productId);
    });

    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map((item: any) => {
        const id =
          typeof item.product === 'object'
            ? item.product?.id || item.product?._id
            : item.product;
        return String(id) === String(productId)
          ? { ...item, quantity: item.quantity + quantity }
          : item;
      });
    } else {
      updatedCart = [...cart, { product: productId, quantity }];
    }

    const updatedUser = await payload.update({
      collection: 'site-users',
      id: user.id,
      data: { cart: updatedCart },
    });

    const items = (updatedUser.cart || []).map((it: any) => {
      const raw = it.product;
      const id =
        typeof raw === 'object' ? raw?.id || raw?._id || raw : raw;
      return { productId: id, quantity: it.quantity };
    });

    return Response.json(
      { message: 'Product added to cart', items },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Add to cart error:', err);
    return Response.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
};
