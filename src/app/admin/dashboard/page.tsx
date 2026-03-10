// src/app/admin/dashboard/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchAllBookings, fetchStaff, fetchServices, fetchBranches,
  updateBookingStatus, upsertStaff, deleteStaffMember, upsertService, deleteService,
  initials, fmtINR,
} from '@/lib/utils';
import type { Booking, Staff, Service, Branch, BookingStatus } from '@/types';

type Tab = 'dashboard' | 'bookings' | 'staff' | 'services' | 'calendar';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab,       setTab]      = useState<Tab>('dashboard');
  const [bookings,  setBookings] = useState<Booking[]>([]);
  const [staff,     setStaff]    = useState<Staff[]>([]);
  const [services,  setServices] = useState<Service[]>([]);
  const [branches,  setBranches] = useState<Branch[]>([]);
  const [loading,   setLoading]  = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [b, st, sv, br] = await Promise.all([
        fetchAllBookings(), fetchStaff(), fetchServices(), fetchBranches(),
      ]);
      setBookings(b); setStaff(st); setServices(sv); setBranches(br);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('admin_auth')) {
      router.replace('/admin');
      return;
    }
    reload();
  }, [reload, router]);

  const logout = () => { sessionStorage.removeItem('admin_auth'); router.push('/admin'); };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Image src="/logo.png" alt="" width={50} height={50} style={{ objectFit: 'contain', opacity: 0.5 }} />
      <div style={{ width: 28, height: 28, border: '2px solid rgba(200,168,110,0.2)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(200,168,110,0.12)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo.png" alt="Scissors" width={24} height={24} style={{ objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px' }}>ADMIN PANEL</div>
              <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10 }}>Scissors™ Dashboard</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reload} style={{ background: 'rgba(200,168,110,0.06)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', color: 'var(--gold)', fontSize: 13, cursor: 'pointer' }}>↻</button>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11, cursor: 'pointer' }}>Exit</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto' }}>
          {([
            ['dashboard', '📊 Overview'],
            ['bookings',  '📋 Bookings'],
            ['staff',     '👥 Staff'],
            ['services',  '✂️ Services'],
            ['calendar',  '📅 Calendar'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: tab === id ? 'rgba(200,168,110,0.15)' : 'transparent',
              border: `1px solid ${tab === id ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 8, padding: '7px 14px',
              color: tab === id ? 'var(--gold)' : 'var(--muted)',
              fontFamily: 'var(--font-outfit)', fontSize: 12, fontWeight: tab === id ? 600 : 400,
              whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 18px' }}>
        {tab === 'dashboard' && <OverviewTab bookings={bookings} staff={staff} />}
        {tab === 'bookings'  && <BookingsTab bookings={bookings} onStatusChange={async (id, s) => {
            try {
              await updateBookingStatus(id, s);
              reload();
            } catch (err: any) {
              alert('Unable to update booking: ' + (err.message || err));
            }
          }} branches={branches} />}
        {tab === 'staff'     && <StaffTab staff={staff} services={services} branches={branches} reload={reload} />}
        {tab === 'services'  && <ServicesTab services={services} reload={reload} />}
        {tab === 'calendar'  && <CalendarTab bookings={bookings} />}
      </div>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────────
function OverviewTab({ bookings, staff }: { bookings: Booking[]; staff: Staff[] }) {
  const today     = new Date().toISOString().split('T')[0];
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const todayBkgs = confirmed.filter(b => b.booking_date === today);
  const totalRev  = confirmed.reduce((a, b) => a + b.total_price, 0);
  const todayRev  = todayBkgs.reduce((a, b) => a + b.total_price, 0);
  const b1Count   = confirmed.filter(b => b.branch_id === 1).length;
  const b2Count   = confirmed.filter(b => b.branch_id === 2).length;
  const total     = b1Count + b2Count;

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const key = d.toISOString().split('T')[0];
    const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    return {
      label: DAYS[d.getDay()],
      count: bookings.filter(b => b.booking_date === key && b.status === 'confirmed').length,
      rev:   bookings.filter(b => b.booking_date === key && b.status === 'confirmed').reduce((a, b) => a + b.total_price, 0),
    };
  });
  const maxCount = Math.max(...last7.map(x => x.count), 1);

  // Top services
  const svcMap: Record<string, number> = {};
  confirmed.forEach(b => b.services.forEach(s => { svcMap[s.name] = (svcMap[s.name] ?? 0) + 1; }));
  const topSvcs = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const KPI = ({ icon, value, label, badge }: { icon: string; value: string; label: string; badge?: string }) => (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '15px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {badge && <span className={`badge badge-gold`}>{badge}</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 26, fontWeight: 700, marginTop: 10 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 3 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHead label="Overview" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <KPI icon="📋" value={todayBkgs.length.toString()} label="Today's Appts" badge="today" />
        <KPI icon="💰" value={fmtINR(todayRev)} label="Today's Revenue" />
        <KPI icon="📈" value={fmtINR(totalRev)} label="Total Revenue" badge="all time" />
        <KPI icon="👥" value={`${staff.filter(s => s.is_active).length}`} label="Active Staff" />
      </div>

      {/* Branch split */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', marginBottom: 14 }}>📍 BRANCH SPLIT</p>
        {[['Branch 1 — Main Road', b1Count], ['Branch 2 — Bus Stand', b2Count]].map(([name, count]) => {
          const pct = total > 0 ? Math.round((count as number) / total * 100) : 0;
          return (
            <div key={name as string} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 12 }}>{name as string}</span>
                <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>{count as number} · {pct}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#c8a86e,#a07840)', borderRadius: 3, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 7-day bar chart */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', marginBottom: 16 }}>📊 LAST 7 DAYS — BOOKINGS</p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 10, fontWeight: 600, minHeight: 14 }}>{d.count > 0 ? d.count : ''}</span>
              <div style={{ width: '100%', minHeight: 4, height: `${Math.max(d.count / maxCount * 62, d.count > 0 ? 10 : 4)}px`, background: d.count > 0 ? 'linear-gradient(to top,#c8a86e,#a07840)' : 'rgba(255,255,255,0.06)', borderRadius: '4px 4px 0 0', transition: 'height 0.6s ease' }} />
              <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top services */}
      {topSvcs.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', marginBottom: 14 }}>✂️ TOP SERVICES</p>
          {topSvcs.map(([name, count], i) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(200,168,110,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--dim)', fontSize: 12, width: 16 }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13 }}>{name}</span>
              </div>
              <span className="badge badge-gold">{count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* Status breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([
          ['confirmed', '#4ade80', 'rgba(34,197,94,0.2)'],
          ['cancelled', '#f87171', 'rgba(239,68,68,0.2)'],
        ] as [BookingStatus, string, string][]).map(([status, color, border]) => (
          <div key={status} style={{ background: 'var(--card)', border: `1px solid ${border}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', color, fontSize: 28, fontWeight: 700 }}>
              {bookings.filter(b => b.status === status).length}
            </div>
            <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 3, textTransform: 'capitalize' }}>{status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bookings Tab ───────────────────────────────────────────────────────────────
function BookingsTab({ bookings, onStatusChange, branches }: {
  bookings: Booking[];
  onStatusChange: (id: string, s: BookingStatus) => void;
  branches: Branch[];
}) {
  const [filter,  setFilter]  = useState<'all' | BookingStatus>('all');
  const [branchF, setBranchF] = useState(0);
  const [search,  setSearch]  = useState('');

  const filtered = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => branchF === 0 || b.branch_id === branchF)
    .filter(b => !search || [b.customer_name, b.customer_phone, b.booking_ref].some(v => v.toLowerCase().includes(search.toLowerCase())));

  const statusColors: Record<string, string> = { confirmed: 'badge-green', cancelled: 'badge-red', completed: 'badge-blue', no_show: 'badge-gray' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionHead label="All Bookings" />
        <span className="badge badge-gold">{filtered.length} shown</span>
      </div>
      <input className="input-field" placeholder="🔍 Search name, ref, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto' }} className="scrollbar-hide">
        {(['all', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'rgba(200,168,110,0.15)' : 'transparent', border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 12px', color: filter === f ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <select value={branchF} onChange={e => setBranchF(+e.target.value)} style={{ marginLeft: 'auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
          <option value={0}>All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" message="No bookings found" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((b, i) => (
            <div key={b.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', animation: `fadeUp 0.3s ${i * 0.03}s ease both` }}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{b.customer_name}</div>
                    <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>📞 +91 {b.customer_phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${statusColors[b.status] ?? 'badge-gray'}`}>{b.status}</span>
                    <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>{fmtINR(b.total_price)}</div>
                  </div>
                </div>
                <div className="gold-line" style={{ margin: '10px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
                  {[['🆔', b.booking_ref], ['📍', b.branch?.area ?? `Branch ${b.branch_id}`], ['📅', b.booking_date], ['🕐', b.time_str], ['👤', (b as any).staff?.name ?? 'N/A'], ['✂️', b.services.map(s => s.name).join(', ')], ['⏱', `~${b.duration_minutes} min`]].map(([k, v]) => (
                    <div key={k as string} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11 }}>{k as string}</span>
                      <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, lineHeight: 1.4 }}>{v as string}</span>
                    </div>
                  ))}
                </div>
                {b.note && (
                  <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '7px 10px' }}>
                    <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11 }}>💬 {b.note}</p>
                  </div>
                )}
              </div>
              {b.status === 'confirmed' && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <ActionBtn label="✕ Cancel"   color="#f87171" bg="rgba(239,68,68,0.08)"   border="rgba(239,68,68,0.25)"   onClick={() => onStatusChange(b.id, 'cancelled')} />
                  <ActionBtn label="✓ Complete" color="#4ade80" bg="rgba(34,197,94,0.08)"   border="rgba(34,197,94,0.25)"   onClick={() => onStatusChange(b.id, 'completed')} />
                  <ActionBtn label="No Show"   color="var(--muted)" bg="rgba(255,255,255,0.04)" border="var(--border)"      onClick={() => onStatusChange(b.id, 'no_show')} />
                </div>
              )}
              {(b.status === 'cancelled' || b.status === 'no_show') && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                  <ActionBtn label="↩ Restore" color="var(--gold)" bg="rgba(200,168,110,0.07)" border="var(--border)" onClick={() => onStatusChange(b.id, 'confirmed')} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Staff Tab ──────────────────────────────────────────────────────────────────
const BLANK_STAFF: Omit<Staff, 'id' | 'staff_code' | 'created_at'> = {
  name: '', role: '', branch_id: 1, phone: '', bio: '',
  avatar_color: '#c8a86e', service_ids: [], is_active: true,
  join_date: new Date().toISOString().split('T')[0],
};

function StaffTab({ staff, services, branches, reload }: {
  staff: Staff[]; services: Service[]; branches: Branch[];
  reload: () => void;
}) {
  const [form,    setForm]    = useState<Partial<Staff> | null>(null);
  const [branchF, setBranchF] = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting] = useState<string | null>(null);

  const filtered = staff.filter(s => branchF === 0 || s.branch_id === branchF);

  const save = async () => {
    if (!form?.name?.trim() || !form?.role?.trim()) return;
    setSaving(true);
    try {
      await upsertStaff(form as Staff);
      setForm(null);
      reload();
    } catch (err: any) {
      alert('Failed to save staff: ' + (err.message || err));
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this staff member? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteStaffMember(id);
      reload();
    } catch (err: any) {
      alert('Failed to delete staff: ' + (err.message || err));
    } finally { setDeleting(null); }
  };

  if (form !== null) return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 28 }}>
          {form.id ? 'Edit' : 'Add'} <em style={{ color: 'var(--gold)' }}>Staff</em>
        </h3>
        <button onClick={() => setForm(null)} className="btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>Cancel</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {([['Full Name *', 'text', 'name', 'Enter full name'], ['Role / Title *', 'text', 'role', 'e.g. Senior Barber'], ['Phone', 'tel', 'phone', '10-digit'], ['Join Date', 'date', 'join_date', '']] as [string, string, keyof Staff, string][]).map(([label, type, key, ph]) => (
          <div key={key as string}>
            <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>{label}</label>
            <input className="input-field" type={type} placeholder={ph} value={(form[key] as string) ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <div>
          <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Bio (Optional)</label>
          <textarea className="input-field" placeholder="Brief professional bio..." value={form.bio ?? ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Branch *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {branches.map(b => (
              <button key={b.id} onClick={() => setForm({ ...form, branch_id: b.id })} style={{ flex: 1, background: form.branch_id === b.id ? 'rgba(200,168,110,0.15)' : 'transparent', border: `1px solid ${form.branch_id === b.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 8px', color: form.branch_id === b.id ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                {b.name.split('—')[0].trim()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Services Offered</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {services.map(s => {
              const sel = (form.service_ids ?? []).includes(s.id);
              return (
                <button key={s.id} onClick={() => setForm({ ...form, service_ids: sel ? (form.service_ids ?? []).filter(x => x !== s.id) : [...(form.service_ids ?? []), s.id] })} style={{ background: sel ? 'rgba(200,168,110,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 10px', color: sel ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {s.icon} {s.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Avatar Color</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="color" value={form.avatar_color ?? '#c8a86e'} onChange={e => setForm({ ...form, avatar_color: e.target.value })} style={{ width: 48, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }} />
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${form.avatar_color ?? '#c8a86e'}, #3a2010)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-outfit)', fontWeight: 700, fontSize: 14 }}>
              {form.name ? initials(form.name) : 'AB'}
            </div>
          </div>
        </div>
        <button className="btn-gold" onClick={save} disabled={saving}>{saving ? 'Saving...' : (form.id ? 'Save Changes' : 'Add Staff Member')}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionHead label="Staff" />
        <button className="btn-gold" onClick={() => setForm({ ...BLANK_STAFF })} style={{ width: 'auto', padding: '8px 16px', fontSize: 12, borderRadius: 9, animation: 'none', boxShadow: 'none' }}>+ Add</button>
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
        {[[0, 'All'], [1, 'Branch 1'], [2, 'Branch 2']].map(([id, l]) => (
          <button key={id} onClick={() => setBranchF(id as number)} style={{ background: branchF === id ? 'rgba(200,168,110,0.15)' : 'transparent', border: `1px solid ${branchF === id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 12px', color: branchF === id ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11, cursor: 'pointer' }}>
            {l as string}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((s, i) => (
          <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', opacity: s.is_active ? 1 : 0.55, animation: `fadeUp 0.3s ${i * 0.05}s ease both` }}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg,${s.avatar_color},#3a2010)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-outfit)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {initials(s.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                    <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>{s.is_active ? 'Active' : 'Off'}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.role}</div>
                  <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--dim)', fontSize: 11, marginTop: 1 }}>Branch {s.branch_id} · {s.phone}</div>
                </div>
              </div>
              {s.service_ids.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {services.filter(sv => s.service_ids.includes(sv.id)).map(sv => (
                    <span key={sv.id} className="badge badge-gray">{sv.icon} {sv.name}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <ActionBtn label="✏️ Edit" color="var(--gold)" bg="rgba(200,168,110,0.08)" border="var(--border)" onClick={() => setForm({ ...s })} />
              <ActionBtn label={s.is_active ? 'Pause' : 'Activate'} color="var(--muted)" bg="rgba(255,255,255,0.04)" border="var(--border)" onClick={async () => { await upsertStaff({ ...s, is_active: !s.is_active }); reload(); }} />
              <ActionBtn label={deleting === s.id ? '...' : '🗑'} color="#f87171" bg="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.2)" onClick={() => del(s.id)} style={{ flex: '0 0 40px', padding: '8px 0' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Services Tab ───────────────────────────────────────────────────────────────
function ServicesTab({ services, reload }: { services: Service[]; reload: () => void }) {
  const [form,   setForm]   = useState<Partial<Service> | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form?.name?.trim() || !form.price || !form.duration_minutes) return;
    setSaving(true);
    try {
      await upsertService(form as Service);
      setForm(null);
      reload();
    } catch (err: any) {
      alert('Failed to save service: ' + (err.message || err));
    } finally { setSaving(false); }
  };

  if (form !== null) return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 28 }}>{form.id ? 'Edit' : 'Add'} <em style={{ color: 'var(--gold)' }}>Service</em></h3>
        <button onClick={() => setForm(null)} className="btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>Cancel</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {([['Service Name *', 'text', 'name', 'e.g. Haircut'], ['Description', 'text', 'description', 'Brief description'], ['Icon (emoji)', 'text', 'icon', '✂️']] as [string, string, keyof Service, string][]).map(([label, type, key, ph]) => (
          <div key={key as string}>
            <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>{label}</label>
            <input className="input-field" type={type} placeholder={ph} value={(form[key] as string) ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Price (₹) *</label>
            <input className="input-field" type="number" placeholder="150" value={form.price ?? ''} onChange={e => setForm({ ...form, price: +e.target.value })} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Duration (min) *</label>
            <input className="input-field" type="number" placeholder="30" value={form.duration_minutes ?? ''} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_popular ?? false} onChange={e => setForm({ ...form, is_popular: e.target.checked })} />
            <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 13 }}>Mark as Popular (HOT badge)</span>
          </label>
        </div>
        <button className="btn-gold" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Service'}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionHead label="Services" />
        <button className="btn-gold" onClick={() => setForm({ icon: '✂️', is_popular: false, is_active: true, sort_order: services.length + 1 })} style={{ width: 'auto', padding: '8px 16px', fontSize: 12, borderRadius: 9, animation: 'none', boxShadow: 'none' }}>+ Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {services.map((s, i) => (
          <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, animation: `fadeUp 0.3s ${i * 0.03}s ease both` }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(200,168,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                {s.is_popular && <span className="badge badge-gold">HOT</span>}
              </div>
              <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11 }}>{s.duration_minutes} min</span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>₹{s.price}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <button onClick={() => setForm({ ...s })} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>✏️</button>
                <button onClick={async () => {
                    if (!confirm('Delete this service?')) return;
                    await deleteService(s.id);
                    reload();
                  }}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer' }}>
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar Tab ───────────────────────────────────────────────────────────────
function CalendarTab({ bookings }: { bookings: Booking[] }) {
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchF, setBranchF] = useState(0);

  const dates = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i - 3);
    return { day: DAYS[d.getDay()], date: d.getDate(), month: MONTHS[d.getMonth()], full: d.toISOString().split('T')[0], isToday: i === 3 };
  });

  const dayBkgs = bookings
    .filter(b => b.booking_date === selDate && b.status === 'confirmed')
    .filter(b => branchF === 0 || b.branch_id === branchF)
    .sort((a, b) => a.time_minutes - b.time_minutes);

  const dayRev = dayBkgs.reduce((a, b) => a + b.total_price, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionHead label="Calendar" />
        <div style={{ display: 'flex', gap: 6 }}>
          {[[0, 'All'], [1, 'B1'], [2, 'B2']].map(([id, l]) => (
            <button key={id} onClick={() => setBranchF(id as number)} style={{ background: branchF === id ? 'rgba(200,168,110,0.15)' : 'transparent', border: `1px solid ${branchF === id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 7, padding: '5px 10px', color: branchF === id ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-outfit)', fontSize: 11, cursor: 'pointer' }}>{l as string}</button>
          ))}
        </div>
      </div>

      <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
        {dates.map(d => {
          const cnt = bookings.filter(b => b.booking_date === d.full && b.status === 'confirmed' && (branchF === 0 || b.branch_id === branchF)).length;
          const sel = selDate === d.full;
          return (
            <div key={d.full} className="card-tap" onClick={() => setSelDate(d.full)} style={{ flexShrink: 0, width: 58, padding: '11px 5px', borderRadius: 14, textAlign: 'center', background: sel ? 'linear-gradient(160deg,#c8a86e,#7a5428)' : 'var(--card)', border: `1.5px solid ${sel ? 'var(--gold)' : 'var(--border)'}`, transition: 'all 0.2s' }}>
              <div style={{ fontFamily: 'var(--font-outfit)', color: sel ? 'rgba(0,0,0,0.65)' : 'var(--muted)', fontSize: 9 }}>{d.day}</div>
              <div style={{ fontFamily: 'var(--font-cormorant)', color: sel ? '#000' : 'var(--text)', fontSize: 22, fontWeight: 700, margin: '3px 0' }}>{d.date}</div>
              {cnt > 0 && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: sel ? 'rgba(0,0,0,0.25)' : 'var(--gold)', color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontFamily: 'var(--font-outfit)' }}>{cnt}</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[['📋', dayBkgs.length, 'Appointments'], ['💰', fmtINR(dayRev), 'Revenue']].map(([icon, val, label]) => (
          <div key={label as string} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: val.toString().length > 4 ? 18 : 26, fontWeight: 700 }}>{val as string}</div>
            <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{label as string}</div>
          </div>
        ))}
      </div>

      {dayBkgs.length === 0 ? (
        <EmptyState icon="📅" message="No confirmed bookings on this day" />
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom,var(--gold),transparent)', opacity: 0.3 }} />
          {dayBkgs.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', gap: 14, marginBottom: 12, animation: `fadeUp 0.3s ${i * 0.07}s ease both` }}>
              <div style={{ flexShrink: 0, marginTop: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 0 2px #000, 0 0 0 3px var(--gold)' }} />
              </div>
              <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{b.customer_name}</div>
                    <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 12, marginTop: 1, fontWeight: 500 }}>{b.time_str} · ~{b.duration_minutes} min</div>
                    <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{b.services.map(s => s.name).join(' + ')}</div>
                    <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--dim)', fontSize: 11, marginTop: 1 }}>👤 {(b as any).staff?.name ?? 'N/A'} · Branch {b.branch_id}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 17, fontWeight: 700, flexShrink: 0 }}>{fmtINR(b.total_price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared micro-components ────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase' }}>{label}</p>;
}

function ActionBtn({ label, color, bg, border, onClick, style }: { label: string; color: string; bg: string; border: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px', color, fontFamily: 'var(--font-outfit)', fontSize: 12, cursor: 'pointer', transition: 'opacity 0.2s', ...style }}>
      {label}
    </button>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 14 }}>{message}</p>
    </div>
  );
}
