// src/app/success/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function SuccessContent() {
  const p         = useSearchParams();
  const ref       = p.get('ref')    ?? 'SC000000';
  const name      = p.get('name')   ?? '';
  const date      = p.get('date')   ?? '';
  const time      = p.get('time')   ?? '';
  const branchArea= p.get('branch') ?? '';
  const staffName = p.get('staff')  ?? '';
  const price     = p.get('price')  ?? '0';
  const phone     = p.get('phone')  ?? '';

  // Format date string
  const dateObj = date ? new Date(date + 'T00:00:00') : null;
  const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateLabel = dateObj
    ? `${DAYS[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}`
    : date;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 24px', textAlign: 'center' }}>

      {/* Animated check */}
      <div style={{ animation: 'scaleIn 0.7s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={50} stroke="rgba(200,168,110,0.15)" strokeWidth="2" fill="none" />
          <circle cx={55} cy={55} r={50} stroke="var(--gold)" strokeWidth="2" fill="none"
            strokeDasharray="315" strokeDashoffset="315"
            style={{ animation: 'checkStroke 1s 0.2s ease forwards' }} />
          <path d="M36 55 L50 69 L76 42" stroke="var(--gold)" strokeWidth="3" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="80" strokeDashoffset="80"
            style={{ animation: 'checkStroke 0.5s 0.9s ease forwards' }} />
        </svg>
      </div>

      {/* Heading */}
      <div style={{ animation: 'fadeUp 0.5s 0.4s ease both', marginTop: 22 }}>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 9, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 8 }}>
          Booking Confirmed
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 46, fontWeight: 600, lineHeight: 1.05 }}>
          You're all<br /><em style={{ color: 'var(--gold)' }}>set!</em>
        </h1>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 14, marginTop: 14, lineHeight: 1.8 }}>
          See you on <strong style={{ color: 'var(--text)' }}>{dateLabel}</strong><br />
          at <strong style={{ color: 'var(--text)' }}>{time}</strong> with <strong style={{ color: 'var(--text)' }}>{staffName}</strong>
        </p>
      </div>

      {/* Summary card */}
      <div style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginTop: 28, animation: 'fadeUp 0.5s 0.6s ease both' }}>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
          Your Booking
        </p>
        {([
          ['🆔 Reference', ref],
          ['👤 Name',      name],
          ['📍 Branch',    branchArea],
          ['👨 Barber',    staffName],
          ['📅 Date',      dateLabel],
          ['🕐 Time',      time],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(200,168,110,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12 }}>{k}</span>
            <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14 }}>
          <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12 }}>💰 Total</span>
          <span style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 28, fontWeight: 700 }}>₹{price}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, animation: 'fadeUp 0.5s 0.8s ease both' }}>
        <a href={`https://wa.me/91${phone}?text=Hi%2C+your+Scissors+appointment+is+confirmed+for+${encodeURIComponent(dateLabel)}+at+${encodeURIComponent(time)}.+Ref%3A+${ref}`}
          target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn-outline" style={{ width: '100%', padding: 14, borderColor: 'rgba(37,211,102,0.3)', color: '#25d366' }}>
            📲 Share on WhatsApp
          </button>
        </a>
        <Link href="/book" style={{ textDecoration: 'none' }}>
          <button className="btn-gold" style={{ padding: 16 }}>Book Another Appointment</button>
        </Link>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn-outline" style={{ width: '100%', padding: 12 }}>← Back to Home</button>
        </Link>
      </div>

      <div style={{ marginTop: 28, animation: 'fadeIn 0.5s 1.2s ease both' }}>
        <Image src="/logo.png" alt="Scissors" width={36} height={36} style={{ objectFit: 'contain', opacity: 0.35, margin: '0 auto' }} />
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--dim)', fontSize: 11, marginTop: 10 }}>
          Payment due at the salon · Arrive 5 min early<br />
          For changes, call the branch directly.
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(200,168,110,0.2)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
