import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { cookies } from 'next/headers';

export const POST = async (request: Request) => {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
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

    const payload = await getPayload({ config: configPromise });

    const userQuery = await payload.find({
      collection: 'site-users',
      where: { email: { equals: userEmail } },
    });

    const user = userQuery.docs[0];
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const wishlist = user.wishlist || [];

    if (wishlist.includes(productId)) {
      return Response.json({ message: 'Already in wishlist' }, { status: 200 });
    }

    const updatedWishlist = [...wishlist, productId];

    await payload.update({
      collection: 'site-users',
      id: user.id,
      data: { wishlist: updatedWishlist },
    });

    return Response.json(
      { message: 'Added to wishlist', wishlist: updatedWishlist },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Wishlist error:', err);
    return Response.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
};
