import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions'; // Adjust path as needed
import { cookies } from "next/headers";

export const POST = async (req: Request) => {
  try {
    const { referralCode } = await req.json();

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

    const currentUserData = await payload.find({
      collection: "site-users",
      where: { email: { equals: userEmail } },
      limit: 1,
    });

    const currentUser = currentUserData.docs[0];

    console.log('Referral - Current user data:', currentUser);

    if (!currentUser) {
      return Response.json({ message: "User not found in site-users" }, { status: 404 });
    }

    if (currentUser.referralCode === referralCode) {
      return Response.json({ message: "You cannot use your own referral code" }, { status: 400 });
    }

    if (currentUser.referralUsed) {
      return Response.json({ message: "Referral code applied already" }, { status: 400 });
    }

    const referralOwnerData = await payload.find({
      collection: "site-users",
      where: { referralCode: { equals: referralCode } },
      limit: 1,
    });

    if (referralOwnerData.totalDocs === 0) {
      return Response.json({ message: "Invalid referral code" }, { status: 404 });
    }

    const owner = referralOwnerData.docs[0];

    await payload.update({
      collection: "site-users",
      id: currentUser.id,
      data: {
        referralPoints: (currentUser.referralPoints || 0) + 3,
        referralUsed: true
      },
    });

    await payload.update({
      collection: "site-users",
      id: owner.id,
      data: {
        referralPoints: (owner.referralPoints || 0) + 5,
      },
    });

    return Response.json({ message: "Referral applied successfully 🎉" });

  } catch (err) {
    console.error('Referral error:', err);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
};