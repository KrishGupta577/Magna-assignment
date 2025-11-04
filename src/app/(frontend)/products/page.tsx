"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "../../components/ProductCard";
import styles from "./ProductsPage.module.css";
import type { Product as PayloadProduct } from "../../../payload-types";

export default function ProductsPage() {
    const [products, setProducts] = useState<Partial<PayloadProduct>[]>([]);
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
                {products.map((product, idx) => (
                    <ProductCard key={String(product.id ?? idx)} product={product} />
                ))}
            </div>
        </div>
    );
}
