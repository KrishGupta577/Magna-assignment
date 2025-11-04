import { CollectionConfig } from 'payload';

export const Cart: CollectionConfig = {
  slug: 'cart',
  labels: { singular: 'Cart Item', plural: 'Cart' },
  admin: {
    useAsTitle: 'product',
  },
  access: {
    read: () => false, // Only via API
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'site-users',
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      name: 'addedAt',
      type: 'date',
      admin: { readOnly: true },
    },
  ],
};

export default Cart;
