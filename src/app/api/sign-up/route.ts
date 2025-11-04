import { generateReferralCode } from '@/app/utils/referralGenerator';
import configPromise from '@payload-config';
import { getPayload } from 'payload';

export const POST = async (request: Request) => {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return Response.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config: configPromise });

    const existingUser = await payload.find({
      collection: 'site-users',
      where: {
        or: [
          { email: { equals: email } },
          { username: { equals: username } },
        ],
      },
      limit: 1,
    });

    if (existingUser.totalDocs > 0) {
      return Response.json(
        { error: 'Username or Email already exists' },
        { status: 409 }
      );
    }

    const referralCode = generateReferralCode()

    const newUser = await payload.create({
      collection: 'site-users',
      data: {
        username,
        email,
        password,
        referralCode,
      },
    });

    return Response.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(error);
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};
