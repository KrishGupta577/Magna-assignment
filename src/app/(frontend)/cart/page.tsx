"use client";

import { useEffect } from "react";
import { useCart } from "@/app/context/CartContext";
import styles from "./CartPage.module.css";

export default function CartPage() {
    const { items, removeFromCart, fetchCart } = useCart();

    useEffect(() => {
        fetchCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    console.log('CartPage items:', items);

    return (
        <div className={styles.container}>
            <h2>Your Cart</h2>
            {items.length === 0 ? (
                <p>No items in your cart.</p>
            ) : (
                <ul className={styles.list}>
                    {items.map((it) => (
                        <li key={it.productId} className={styles.row}>
                            <div className={styles.id}>{it.title ?? it.productId}</div>
                            <div className={styles.controls}>
                                <div className={styles.qtyStatic}>Qty: {it.quantity}</div>
                                <button className={styles.remove} onClick={() => removeFromCart(it.productId)}>Remove</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
