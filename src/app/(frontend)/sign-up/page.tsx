'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn as oauthSignIn } from 'next-auth/react'
import styles from '../auth/AuthForm.module.css'
import Link from 'next/link'

export default function SignUpPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const submit = async (e: any) => {
    e.preventDefault()
    setError(null)
    if (!form.username || !form.email || !form.password) {
      setError('All fields are required')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/sign-up', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form), credentials: "include", })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || data.message || 'Sign up failed')
        return
      }
      // after signup, you may sign in automatically or navigate to sign-in
      router.push('/sign-in')
    } catch (err: any) {
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={submit}>
        <h2 className={styles.title}>Create account</h2>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          Username
          <input className={styles.input} name="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" />
        </label>

        <label className={styles.label}>
          Email
          <input className={styles.input} name="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </label>

        <label className={styles.label}>
          Password
          <input className={styles.input} name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
          <button type="button" className={styles.ghost} onClick={() => oauthSignIn('google', { callbackUrl: '/products' })}>Continue with Google</button>
        </div>

        <div className={styles.footer}>
          <span>Already have an account? </span><Link href="/sign-in">Sign in</Link>
        </div>
      </form>
    </div>
  )
}