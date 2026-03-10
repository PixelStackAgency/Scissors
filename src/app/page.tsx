// src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchBranches, fetchServices } from '@/lib/utils';
import type { Branch, Service } from '@/types';

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    Promise.all([fetchBranches(), fetchServices()])
      .then(([b, s]) => { setBranches(b); setServices(s); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative rings */}
        {[280, 420, 560].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', width: s, height: s,
            border: `1px solid rgba(200,168,110,${0.06 - i * 0.015})`,
            borderRadius: '50%', top: '46%', left: '50%',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          }} />
        ))}

        {/* Top bar */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="animate-fade-in">
            <Image src="/logo.png" alt="Scissors" width={30} height={30} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>
              Scissors™
            </span>
          </div>
          <Link href="/admin" style={{
            background: 'rgba(200,168,110,0.06)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 14px',
            color: 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11,
            letterSpacing: '0.5px', textDecoration: 'none', transition: 'all 0.2s',
          }}>
            ADMIN ↗
          </Link>
        </nav>

        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px 28px 32px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div className="animate-rotate-in">
            <Image src="/logo.png" alt="Scissors Men's Beauty Lounge" width={100} height={100}
              style={{ objectFit: 'contain', filter: 'brightness(1.1)' }} priority />
          </div>

          <div style={{ marginTop: 22 }} className="animate-fade-up">
            <p style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-outfit)' }}>
              Premium Men's Grooming
            </p>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 56, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1 }}>
              scissors<sup style={{ fontSize: 18, color: 'var(--gold)', fontWeight: 300 }}>™</sup>
            </h1>
            <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 19, fontStyle: 'italic', marginTop: 4, fontWeight: 300 }}>
              Men's Beauty Lounge
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, animation: 'fadeUp 0.6s 0.3s ease both' }}>
            <div style={{ height: 1, width: 36, background: 'linear-gradient(90deg,transparent,var(--gold-dark))' }} />
            <p style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '0.5px', fontFamily: 'var(--font-outfit)' }}>
              2 Branches · Bhatkal, Karnataka
            </p>
            <div style={{ height: 1, width: 36, background: 'linear-gradient(90deg,var(--gold-dark),transparent)' }} />
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', width: '100%', marginTop: 32,
            border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden',
            animation: 'fadeUp 0.6s 0.4s ease both',
          }}>
            {[['1000+', 'Happy Clients'], ['10+', 'Expert Barbers'], ['4.9★', 'Rating']].map(([v, l], i) => (
              <div key={l} style={{
                flex: 1, padding: '18px 8px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                background: 'rgba(200,168,110,0.025)',
              }}>
                <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 26, fontWeight: 700 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ width: '100%', marginTop: 28, animation: 'fadeUp 0.6s 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/book" style={{ textDecoration: 'none' }}>
              <button className="btn-gold" style={{ fontSize: 15, padding: 18 }}>
                Book Appointment ✂️
              </button>
            </Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="tel:+919876543210" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="btn-outline" style={{ width: '100%', fontSize: 12 }}>📞 Branch 1</button>
              </a>
              <a href="tel:+919876543211" style={{ flex: 1, textDecoration: 'none' }}>
                <button className="btn-outline" style={{ width: '100%', fontSize: 12 }}>📞 Branch 2</button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* ── SERVICES PREVIEW ──────────────────────────────── */}
      <section style={{ padding: '52px 20px' }}>
        <p style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'var(--font-outfit)' }}>Our Expertise</p>
        <h2 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 40, marginTop: 6, lineHeight: 1.1 }}>
          Premium<br /><em style={{ color: 'var(--gold)', fontWeight: 300 }}>Services</em>
        </h2>

        {!loaded ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, height: 110, animation: `scaleIn 0.3s ${i * 0.05}s ease both` }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            {services.slice(0, 6).map((s, i) => (
              <div key={s.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
                padding: '16px 14px', position: 'relative', overflow: 'hidden',
                animation: `scaleIn 0.35s ${i * 0.05}s ease both`,
              }}>
                {s.is_popular && (
                  <div style={{ position: 'absolute', top: 9, right: 9, background: 'var(--gold)', color: '#000', fontSize: 8, fontFamily: 'var(--font-outfit)', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>
                    HOT
                  </div>
                )}
                <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>₹{s.price}</div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{s.duration_minutes} min</div>
              </div>
            ))}
          </div>
        )}
        <Link href="/book" style={{ textDecoration: 'none' }}>
          <button className="btn-outline" style={{ width: '100%', marginTop: 14 }}>View All & Book →</button>
        </Link>
      </section>

      <div className="gold-line" />

      {/* ── BRANCHES ──────────────────────────────────────── */}
      <section style={{ padding: '52px 20px' }}>
        <p style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'var(--font-outfit)' }}>Find Us</p>
        <h2 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 40, marginTop: 6, lineHeight: 1.1 }}>
          Our<br /><em style={{ color: 'var(--gold)', fontWeight: 300 }}>Branches</em>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
          {(loaded && branches.length > 0 ? branches : [
            { id: 1, name: 'Branch 1 — Main Road', area: 'Main Road, Bhatkal', phone: '+91 98765 43210', hours: '9:00 AM – 9:00 PM', map_url: 'https://share.google/1RWsx10jULttWMb3e', city: '', is_active: true },
            { id: 2, name: 'Branch 2 — Bus Stand', area: 'New Bus Stand, Bhatkal', phone: '+91 98765 43211', hours: '9:00 AM – 9:00 PM', map_url: 'https://share.google/42cneZWvx2O8wKcsP', city: '', is_active: true },
          ]).map((b, i) => (
            <div key={b.id} style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18,
              overflow: 'hidden', animation: `fadeUp 0.45s ${i * 0.1}s ease both`,
            }}>
              <div style={{ background: 'linear-gradient(135deg,#141008,#080808)', padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,168,110,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  📍
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{b.area}</div>
                </div>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12 }}>🕐 {b.hours}</span>
                  <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12 }}>📞 {b.phone}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {b.map_url && (
                    <a href={b.map_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                      <button className="btn-outline" style={{ width: '100%', fontSize: 12 }}>🗺 Directions</button>
                    </a>
                  )}
                  <Link href="/book" style={{ flex: 1, textDecoration: 'none' }}>
                    <button className="btn-gold" style={{ fontSize: 12, padding: 11, borderRadius: 10, animation: 'none' }}>Book Here</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="gold-line" />

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ padding: '40px 22px 60px', textAlign: 'center' }}>
        <Image src="/logo.png" alt="Scissors" width={44} height={44} style={{ objectFit: 'contain', opacity: 0.4 }} />
        <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--muted)', fontSize: 14, marginTop: 14, fontStyle: 'italic' }}>
          "Where every man deserves to look his best."
        </p>
        <a href="https://www.instagram.com/scissorsmensbeautylounge" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: 'var(--gold-dark)', textDecoration: 'none', fontSize: 12, fontFamily: 'var(--font-outfit)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @scissorsmensbeautylounge
        </a>
        <p style={{ fontFamily: 'var(--font-outfit)', color: '#1c1610', fontSize: 11, marginTop: 20 }}>
          © 2025 Scissors™ Men's Beauty Lounge · Bhatkal, Karnataka
        </p>
      </footer>
    </div>
  );
}
