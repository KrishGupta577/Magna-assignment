'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn as oauthSignIn } from 'next-auth/react'
import styles from '../auth/AuthForm.module.css'
import Link from 'next/link'

function getErrorMessage(err: unknown) {
    if (err instanceof Error) return err.message
    try {
        return String(err)
    } catch {
        return 'Unknown error'
    }
}

export default function SignInPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        if (!form.email || !form.password) {
            setError('Email and password are required')
            return
        }

        try {
            setLoading(true)
            const res = await fetch('/api/sign-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || data.message || 'Sign in failed')
                return
            }
            // assume server created session; redirect
            router.push('/products')
        } catch (err: unknown) {
            setError(getErrorMessage(err) || 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.wrap}>
            <form className={styles.form} onSubmit={submit}>
                <h2 className={styles.title}>Sign In</h2>

                {error && <div className={styles.error}>{error}</div>}

                <label className={styles.label}>
                    Email or username
                    <input
                        name="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className={styles.input}
                        placeholder="you@example.com"
                    />
                </label>

                <label className={styles.label}>
                    Password
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className={styles.input}
                        placeholder="••••••••"
                    />
                </label>

                <div className={styles.actions}>
                    <button type="submit" className={styles.primary} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
                    <button type="button" className={styles.ghost} onClick={() => oauthSignIn("google", { callbackUrl: "/products" })}>Continue with Google</button>
                </div>

                <div className={styles.footer}>
                    <span>Don&apos;t have an account? </span><Link href="/sign-up">Sign up</Link>
                </div>
            </form>
        </div>
    )
}