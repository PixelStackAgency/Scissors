// src/app/admin/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const router   = useRouter();
  const [pw,     setPw]   = useState('');
  const [error,  setError] = useState(false);
  const [loading,setLoad] = useState(false);

  const login = () => {
    setLoad(true);
    setTimeout(() => {
      const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'scissors2025';
      if (pw === correct) {
        sessionStorage.setItem('admin_auth', '1');
        router.push('/admin/dashboard');
      } else {
        setError(true); setPw(''); setLoad(false);
      }
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 28px' }}>
      <div style={{ width: '100%', maxWidth: 340, textAlign: 'center', animation: 'scaleIn 0.5s ease' }}>
        <Image src="/logo.png" alt="Scissors" width={72} height={72} style={{ objectFit: 'contain' }} />
        <h2 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 38, marginTop: 20 }}>
          Admin<br /><em style={{ color: 'var(--gold)' }}>Access</em>
        </h2>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 13, marginTop: 8, marginBottom: 28 }}>
          Enter your admin password to continue
        </p>
        <input
          className={`input-field ${error ? 'error' : ''}`}
          type="password"
          placeholder="Admin password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ textAlign: 'center', fontSize: 16, letterSpacing: 4, marginBottom: 8 }}
        />
        {error && (
          <p style={{ fontFamily: 'var(--font-outfit)', color: '#f87171', fontSize: 12, marginBottom: 12, animation: 'scaleIn 0.2s ease' }}>
            ✕ Incorrect password. Try again.
          </p>
        )}
        <button className="btn-gold" onClick={login} disabled={loading || !pw}
          style={{ marginTop: 8, fontSize: 14 }}>
          {loading
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Verifying...
              </span>
            : '🔐 Unlock Admin Panel'}
        </button>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 13, marginTop: 18, cursor: 'pointer', display: 'block', width: '100%' }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
