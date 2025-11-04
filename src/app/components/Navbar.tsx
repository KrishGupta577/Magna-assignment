"use client";

import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <h2 className={styles.logo}>MyShop</h2>
      <div className={styles.links}>
        <Link href="/products">Products</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/wishlist">Wishlist</Link>
        <Link href="/profile">Profile</Link>
      </div>
    </nav>
  );
}
