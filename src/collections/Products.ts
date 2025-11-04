// collections/Products.ts
import { CollectionConfig } from 'payload';

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  access: {
    read: () => true,
  },
  admin: { useAsTitle: 'productName' },
  fields: [
    { name: 'productName', type: 'text', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'image',
      type: 'upload', // ✅ Better for storing actual media
      relationTo: 'media',
      required: false,
    }
  ],
};
