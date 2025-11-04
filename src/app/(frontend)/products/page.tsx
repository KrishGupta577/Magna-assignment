"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/app/components/ProductCard";
import styles from "./ProductsPage.module.css";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const { cartCount, addToCart } = useCart();

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then((data) => {
                // payload's REST GET may return an object (with `docs`) rather than a bare array.
                if (Array.isArray(data)) return setProducts(data);
                if (data?.docs && Array.isArray(data.docs)) return setProducts(data.docs);
                if (data?.items && Array.isArray(data.items)) return setProducts(data.items);
                // fallback: attempt to coerce to array or empty
                return setProducts([]);
            });
    }, []);

    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.products}>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
