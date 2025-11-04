"use client";
import { useCart } from "../context/CartContext";
import styles from "./Sidebar.module.css";
import Link from "next/link";

export default function Sidebar() {
    const { items, cartCount, updateQuantity, removeFromCart } = useCart();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <h3>Cart</h3>
                <span className={styles.count}>{cartCount}</span>
            </div>

            <div className={styles.items}>
                {items.length === 0 ? (
                    <p className={styles.empty}>Your cart is empty</p>
                ) : (
                    items.map((it) => (
                        <div key={it.productId} className={styles.item}>
                            <div className={styles.meta}>
                                <div className={styles.title}>{it.title}</div>
                                <div className={styles.qty}>Qty: {it.quantity}</div>
                            </div>
                            <div className={styles.controls}>
                                <button
                                    className={styles.small}
                                    onClick={() => updateQuantity(it.productId, Math.max(0, it.quantity - 1))}
                                    aria-label={`decrease-${it.productId}`}
                                >
                                    −
                                </button>
                                <button
                                    className={styles.small}
                                    onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                                    aria-label={`increase-${it.productId}`}
                                >
                                    +
                                </button>
                                <button className={styles.remove} onClick={() => removeFromCart(it.productId)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.footer}>
                <Link href="/cart" className={styles.viewCart}>
                    View Cart
                </Link>
            </div>
        </aside>
    );
}
