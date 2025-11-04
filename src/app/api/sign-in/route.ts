import configPromise from '@payload-config';
import { getPayload } from 'payload';

export const POST = async (request: Request) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json({ error: 'Email and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return Response.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        const payload = await getPayload({ config: configPromise });

        const searchUser = await payload.find({
            collection: 'site-users',
            where: {
                or: [
                    { email: { equals: email } },
                    { username: { equals: email } }
                ]
            }
        })

        const userEmail = searchUser?.docs?.[0]?.email;

        if (!userEmail) {
            return Response.json(
                { message: 'Invalid email or password' },
                { status: 400 }
            );
        }

        const user = await payload.login({
            collection: 'site-users',
            data: { email: userEmail, password },
        });

        return Response.json(
            { message: 'Login successful', user },
            { status: 200 }
        );

    } catch (err: any) {
        console.error(err);
        return Response.json(
            { error: err },
            { status: 401 }
        );
    }
};
