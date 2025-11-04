"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: any }) {
    const { addToCart } = useCart();
    const [wishlistStatus, setWishlistStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');

    const title = product?.productName || product?.name || product?.title || product?.id || "Product";
    const price = product?.price ?? product?.priceInCents ?? null;

    return (
        <div className={styles.card}>
            <div className={styles.media}>
                {product?.image ? <img src={product.image.cloudinaryURL} alt={title} /> : <div className={styles.placeholder}>No image</div>}
            </div>
            <div className={styles.body}>
                <div className={styles.title}>{title}</div>
                {price !== null && <div className={styles.price}>${price}</div>}

                <div className={styles.controls}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button className={styles.add} onClick={() => addToCart(product.id ?? product._id ?? product.id, 1)}>
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
                                        body: JSON.stringify({ productId: product.id ?? product._id ?? product.id }),
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
