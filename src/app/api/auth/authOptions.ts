import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { generateReferralCode } from '@/app/utils/referralGenerator';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const payload = await getPayload({ config: configPromise });

                if (!credentials?.email || !credentials.password) return null;

                const user = await payload.find({
                    collection: 'site-users',
                    where: { email: { equals: credentials.email } },
                    limit: 1,
                });

                if (!user.totalDocs) return null;

                const isValid = await payload.login({
                    collection: 'site-users',
                    data: {
                        email: credentials.email,
                        password: credentials.password,
                    },
                });

                if (!isValid) return null;

                return {
                    id: String(user.docs[0].id),
                    email: user.docs[0].email!,
                    username: user.docs[0].username,
                };
            },
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google' && user.email) {
                const payload = await getPayload({ config: configPromise });

                const existingUser = await payload.find({
                    collection: 'site-users',
                    where: { email: { equals: user.email } },
                    limit: 1,
                });

                if (!existingUser.totalDocs) {
                    await payload.create({
                        collection: 'site-users',
                        data: {
                            email: user.email,
                            username: user.name || user.email.split('@')[0],
                            googleId: account.providerAccountId,
                            referralCode: generateReferralCode(),
                            password: Math.random().toString(36).slice(-10),
                        },
                    });
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },

    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET!,
};

export default authOptions;
