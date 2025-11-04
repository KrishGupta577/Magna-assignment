"use client";

import { useEffect, useState } from "react";
import styles from "./Wishlist.module.css";

export default function WishlistPage() {
    const [items, setItems] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wishlist');
            if (!res.ok) {
                setItems([]);
                return;
            }
            const data = await res.json();
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            console.error(err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchWishlist() }, []);

    const removeItem = async (id: string) => {
        try {
            await fetch('/api/remove-from-wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: id }) });
            fetchWishlist();
        } catch (err) { console.error(err) }
    }

    return (
        <div className={styles.container}>
            <h2>Wishlist</h2>
            {loading ? <p>Loading…</p> : (items && items.length > 0 ? (
                <ul className={styles.list}>
                    {items.map(it => (
                        <li key={it.id} className={styles.row}>
                            <div className={styles.meta}>
                                {it.image ? <img src={it.image} alt={it.title} className={styles.thumb} /> : <div className={styles.thumbPlaceholder} />}
                                <div>
                                    <div className={styles.title}>{it.title}</div>
                                    {it.price != null && <div className={styles.price}>${it.price}</div>}
                                </div>
                            </div>
                            <div>
                                <button className={styles.remove} onClick={() => removeItem(it.id)}>Remove</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Your wishlist is empty.</p>
            ))}
        </div>
    )
}
