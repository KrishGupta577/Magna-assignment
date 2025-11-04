// payload/collections/siteUsers.ts

import { CollectionConfig } from 'payload';

export const siteUsers: CollectionConfig = {
  slug: 'site-users',
  auth: {
    verify: false, // disable email verification for now
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'googleId',
      type: 'text',
      unique: true,
      admin: { readOnly: true },
      hidden: true,
      defaultValue: '',
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'referralPoints',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'wishlist',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'referralUsed',
      type: 'checkbox',
      label: 'Referral Used',
      defaultValue: false,
    }
  ],
};
