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
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
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

    // Normalize cart items so `product` is always the product id (string)
    // Normalize and dedupe cart items so each product appears only once.
    const normalizedMap: Record<string, { product: any; quantity: number }> = {};
    (updatedCart || []).forEach((item: any) => {
      const raw = item.product;
      const productIdVal = typeof raw === 'object' ? (raw?.id ?? raw?._id ?? raw) : raw;
      const key = String(productIdVal);
      if (!normalizedMap[key]) {
        normalizedMap[key] = { product: productIdVal, quantity: Number(item.quantity) || 0 };
      } else {
        normalizedMap[key].quantity += Number(item.quantity) || 0;
      }
    });

    const normalizedCart = Object.keys(normalizedMap).map((k) => normalizedMap[k]);

    // Debug log to help diagnose validation issues in production logs
    console.debug('Updating user cart with normalizedCart:', normalizedCart);

    const updatedUser = await payload.update({
      collection: 'site-users',
      id: user.id,
      // cast to any to avoid TypeScript relationship typing mismatch at compile time
      data: { cart: normalizedCart as any },
    });
    const items = (updatedUser.cart || []).map((it: any) => {
      const raw = it.product;
      const id =
        typeof raw === 'object' ? raw?.id || raw?._id || raw : raw;
      return { productId: id, quantity: it.quantity };
    });

    return NextResponse.json({ message: 'Product added to cart', items }, { status: 200 });
  } catch (err: any) {
    console.error('Add to cart error:', err);
    return NextResponse.json({ error: err?.message || 'Server Error' }, { status: 500 });
  }
};
