import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  try {
    const { productId, quantity = 1 } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const payload = await getPayload({ config: await configPromise });

    const product = await payload.findByID({
      collection: 'products',
      id: productId,
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    const user = userQuery.docs[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- ✅ FIX: Normalize Cart Items ---
    const cart = user.cart || [];
    const normalizedMap: Record<string, { product: string; quantity: number }> = {};

    cart.forEach((item: any) => {
      const id =
        typeof item.product === 'object'
          ? item.product?.id || item.product?._id
          : item.product;

      if (id) {
        normalizedMap[String(id)] = {
          product: String(id),
          quantity: Number(item.quantity) || 1,
        };
      }
    });

    // Add or update current product
    if (normalizedMap[productId]) {
      normalizedMap[productId].quantity += Number(quantity);
    } else {
      normalizedMap[productId] = { product: productId, quantity: Number(quantity) };
    }

    const normalizedCart = Object.values(normalizedMap);

    const updatedUser = await payload.update({
      collection: 'site-users',
      id: user.id,
      data: { cart: normalizedCart },
    });

    return NextResponse.json(
      { message: 'Product added to cart', cart: updatedUser.cart },
      { status: 200 }
    );

  } catch (err: any) {
    console.error('Add to cart error:', err);
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
};
