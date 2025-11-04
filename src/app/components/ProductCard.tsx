"use client";

import { useState } from "react";
import Image from 'next/image'
import { useCart } from "../context/CartContext";
import styles from "./ProductCard.module.css";
import type { Product as PayloadProduct, Media } from "../../payload-types";

type UIProduct = Partial<PayloadProduct & { _id?: string; image?: Media | { cloudinaryURL?: string } | null }>;

export default function ProductCard({ product }: { product: UIProduct }) {
    const { addToCart } = useCart();
    const [wishlistStatus, setWishlistStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');

    const title = (product?.productName || String(product?.id ?? '') || "Product");
    const price = product?.price ?? (product as any)?.priceInCents ?? null;

    return (
        <div className={styles.card}>
            <div className={styles.media}>
                {product?.image && (product as any).image?.cloudinaryURL ? (
                    <Image src={(product as any).image.cloudinaryURL} alt={title} width={320} height={200} />
                ) : (
                    <div className={styles.placeholder}>No image</div>
                )}
            </div>
            <div className={styles.body}>
                <div className={styles.title}>{title}</div>
                {price !== null && <div className={styles.price}>${price}</div>}

                <div className={styles.controls}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button className={styles.add} onClick={() => addToCart(String(product.id ?? ''), 1)}>
                            Add to cart
                        </button>
                        <button
                            className={styles.add}
                            style={{ background: wishlistStatus === 'added' ? '#0a7' : '#eee', color: wishlistStatus === 'added' ? '#fff' : '#111' }}
                            onClick={async () => {
                                if (wishlistStatus === 'adding') return;
                                setWishlistStatus('adding');
                                try {
                                    const res = await fetch('/api/add-to-wishlist', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ productId: product.id ?? '' }),
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        setWishlistStatus('added');
                                    } else {
                                        console.error('add-to-wishlist failed', data);
                                        setWishlistStatus('error');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    setWishlistStatus('error');
                                }
                                setTimeout(() => setWishlistStatus('idle'), 2000);
                            }}
                        >
                            {wishlistStatus === 'adding' ? 'Adding…' : wishlistStatus === 'added' ? 'Saved' : 'Wishlist'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
