// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { adminAuthPlugin } from '@papercup/payload-auth-plugin';
import { GoogleAuthProvider } from '@papercup/payload-auth-plugin/providers';
import { payloadCloudinaryPlugin } from '@jhb.software/payload-cloudinary-plugin';
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { siteUsers } from './collections/Site-Users/Site-Users';
import { Products } from './collections/Products';
import { Cart } from './collections/Cart';

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.AUTH_BASE_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, siteUsers, Products, Cart],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    adminAuthPlugin({
      providers: [
        GoogleAuthProvider({
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
      ],
    }),
    payloadCloudinaryPlugin({
      uploadCollections: ['media'],
      credentials: {
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
      },
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        folder: 'products-media',
      },
      uploadOptions: {
        useFilename: true,
      },
    }),
  ],
})