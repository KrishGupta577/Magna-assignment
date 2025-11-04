import { NextResponse } from 'next/server';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await getPayload({
      config: await configPromise,
    });

    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    const user = userQuery.docs[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updatedCart = (user.cart || []).map((item: any) => {
      const id = typeof item.product === 'object'
        ? item.product?.id || item.product?._id
        : item.product;

      if (String(id) === String(productId)) {
        if (item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 }; 
        } else {
          return null; 
        }
      }
      return item;
    }).filter(Boolean);

    const updatedUser = await payload.update({
      collection: 'site-users',
      id: user.id,
      data: { cart: updatedCart },
    });

    const items = (updatedUser.cart || []).map((item: any) => {
      const raw = item.product;
      const id = typeof raw === 'object' ? raw.id || raw._id : raw;
      return {
        productId: id,
        quantity: item.quantity,
      };
    });

    return NextResponse.json({ items }, { status: 200 });

  } catch (err) {
    console.error('remove-from-cart error:', err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
};
