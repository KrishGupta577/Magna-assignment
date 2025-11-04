"use client";

import { useEffect, useState } from "react";
import styles from "./Profile.module.css";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);

    const [status, setStatus] = useState<string | null>(null);
    const [code, setCode] = useState("");

    const loadUser = async () => {
        try {
            const res = await fetch("/api/user", { credentials: "include", });
            if (!res.ok) return;
            const data = await res.json();
            setUser(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.container}>
            <h2>Profile</h2>
            {user ? (
                <>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Your Referral Code:</strong> {user.referralCode}</p>
                    <p><strong>Referral Points:</strong> {user.referralPoints}</p>

                    <div style={{ marginTop: 16 }}>
                        <h3>Apply a referral code</h3>
                        {user.referralUsed ? (
                            <p>You have already applied a referral code.</p>
                        ) : (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setStatus(null);
                                    try {
                                        const res = await fetch('/api/apply-referral', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ referralCode: code.trim() }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                            setStatus(data.message || data.error || 'Failed to apply referral');
                                        } else {
                                            setStatus(data.message || 'Referral applied');
                                            await loadUser();
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        setStatus('Server error');
                                    }
                                }}
                            >
                                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter referral code" />
                                <button type="submit" style={{ marginLeft: 8 }}>Apply</button>
                            </form>
                        )}
                        {status && <p style={{ marginTop: 8 }}>{status}</p>}
                    </div>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}
