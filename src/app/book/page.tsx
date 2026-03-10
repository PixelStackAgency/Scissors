// src/app/book/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchBranches, fetchServices, fetchStaff,
  fetchBookingsForSlot, createBooking,
  getDates, ALL_TIMES, timeToMin, isSlotBlocked, genRef, initials,
} from '@/lib/utils';
import type { Branch, Service, Staff, Booking, BookingState, DateOption } from '@/types';

const STEP_LABELS = ['Branch', 'Services', 'Staff', 'Date', 'Time', 'Details'];
const STEP_COUNT  = 6;

const EMPTY_STATE: BookingState = {
  branch: null, services: [], staff: null,
  date: null, time: null, name: '', phone: '', note: '',
};

export default function BookPage() {
  const router = useRouter();
  const [step,      setStep]     = useState(0);
  const [state,     setState]    = useState<BookingState>(EMPTY_STATE);
  const [branches,  setBranches] = useState<Branch[]>([]);
  const [services,  setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bookings,  setBookings] = useState<Booking[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [submitting,setSubmitting] = useState(false);
  const [errors,    setErrors]   = useState<Record<string, string>>({});
  const [fade,      setFade]     = useState(false);
  const dates = getDates(21);

  const totalPrice    = state.services.reduce((a, s) => a + s.price, 0);
  const totalDuration = state.services.reduce((a, s) => a + s.duration_minutes, 0);

  // Load initial data
  useEffect(() => {
    Promise.all([fetchBranches(), fetchServices()])
      .then(([b, s]) => { setBranches(b); setServices(s); })
      .finally(() => setLoading(false));
  }, []);

  // Load staff when branch is selected
  useEffect(() => {
    if (!state.branch) return;
    fetchStaff(state.branch.id).then(setStaffList);
  }, [state.branch]);

  // Load slot bookings when staff + date selected
  useEffect(() => {
    if (!state.branch || !state.staff || !state.date) return;
    fetchBookingsForSlot(state.branch.id, state.staff.id, state.date.full)
      .then(setBookings);
  }, [state.branch, state.staff, state.date]);

  const update = (patch: Partial<BookingState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const navigate = useCallback((newStep: number) => {
    setFade(true);
    setTimeout(() => { setStep(newStep); setFade(false); window.scrollTo(0, 0); }, 180);
  }, []);

  const canProceed: boolean[] = [
    !!state.branch,
    state.services.length > 0,
    !!state.staff,
    !!state.date,
    !!state.time,
    state.name.trim().length >= 2 && state.phone.replace(/\D/g, '').length === 10,
  ];

  const toggleService = (svc: Service) =>
    update({ services: state.services.find(s => s.id === svc.id) ? state.services.filter(s => s.id !== svc.id) : [...state.services, svc] });

  // Filter staff who can perform at least one selected service
  const eligibleStaff = state.services.length > 0
    ? staffList.filter(st => state.services.some(svc => st.service_ids.includes(svc.id)))
    : staffList;

  const handleSubmit = async () => {
    if (!state.branch || !state.staff || !state.date || !state.time) return;
    setSubmitting(true);
    try {
      const ref = genRef();
      await createBooking({
        booking_ref:      ref,
        branch_id:        state.branch.id,
        staff_id:         state.staff.id,
        customer_name:    state.name.trim(),
        customer_phone:   state.phone.replace(/\D/g, ''),
        note:             state.note.trim(),
        booking_date:     state.date.full,
        time_str:         state.time,
        time_minutes:     timeToMin(state.time),
        duration_minutes: Math.max(totalDuration, 30),
        total_price:      totalPrice,
        services:         state.services.map(s => ({ id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes })),
      });
      router.push(`/success?ref=${ref}&name=${encodeURIComponent(state.name)}&date=${encodeURIComponent(state.date.full)}&time=${encodeURIComponent(state.time)}&branch=${encodeURIComponent(state.branch.area)}&staff=${encodeURIComponent(state.staff.name)}&price=${totalPrice}&phone=${state.phone.replace(/\D/g,'')}`);
    } catch (e: any) {
      setErrors({ submit: e.message ?? 'Booking failed. Please try again.' });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* ── STICKY HEADER ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(200,168,110,0.1)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => step === 0 ? router.push('/') : navigate(step - 1)}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontFamily: 'var(--font-outfit)', fontSize: 13, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            ← {step === 0 ? 'Home' : STEP_LABELS[step - 1]}
          </button>
          <Image src="/logo.png" alt="Scissors" width={22} height={22} style={{ objectFit: 'contain' }} />
        </div>
        {/* Progress bars */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: i <= step ? '100%' : '0%' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-outfit)', fontSize: 9, color: i === step ? 'var(--gold)' : i < step ? 'var(--gold-dark)' : 'var(--dim)', marginTop: 4, textAlign: 'center', transition: 'color 0.3s' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP CONTENT ── */}
      <div style={{ padding: '24px 20px 0', opacity: fade ? 0 : 1, transition: 'opacity 0.18s' }}>

        {step === 0 && (
          <BranchStep branches={branches} selected={state.branch} onSelect={b => update({ branch: b, staff: null })} />
        )}
        {step === 1 && (
          <ServicesStep services={services} selected={state.services} toggle={toggleService} total={totalPrice} dur={totalDuration} />
        )}
        {step === 2 && (
          <StaffStep staff={eligibleStaff} selected={state.staff} onSelect={s => update({ staff: s })}
            services={state.services} branchName={state.branch?.name ?? ''} />
        )}
        {step === 3 && (
          <DateStep dates={dates} selected={state.date}
            onSelect={d => update({ date: d, time: null })} />
        )}
        {step === 4 && state.date && state.staff && state.branch && (
          <TimeStep
            times={ALL_TIMES} selected={state.time}
            onSelect={t => update({ time: t })}
            bookings={bookings} duration={Math.max(totalDuration, 30)}
            staffName={state.staff.name} dateLabel={`${state.date.day}, ${state.date.date} ${state.date.month}`}
          />
        )}
        {step === 5 && (
          <DetailsStep state={state} update={update} totalPrice={totalPrice} totalDuration={totalDuration}
            errors={errors} />
        )}

        {errors.submit && (
          <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#f87171', fontFamily: 'var(--font-outfit)', fontSize: 13 }}>
            ⚠️ {errors.submit}
          </div>
        )}
      </div>

      {/* ── STICKY BOTTOM CTA ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 440, padding: '14px 20px', paddingBottom: 'max(28px,env(safe-area-inset-bottom,28px))', background: 'linear-gradient(to top,#000 65%,transparent)', zIndex: 40 }}>
        <button className="btn-gold"
          disabled={!canProceed[step] || submitting}
          onClick={() => step < STEP_COUNT - 1 ? navigate(step + 1) : handleSubmit()}
          style={{ fontSize: 14 }}>
          {submitting
            ? <><span className="animate-spin-fast" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #000', borderRadius: '50%' }} /> Confirming...</>
            : step === STEP_COUNT - 1
              ? '✓ Confirm Appointment'
              : `Continue to ${STEP_LABELS[step + 1]} →`}
        </button>
      </div>
    </div>
  );
}

// ── Step: Branch ───────────────────────────────────────────────────────────────
function BranchStep({ branches, selected, onSelect }: { branches: Branch[]; selected: Branch | null; onSelect: (b: Branch) => void }) {
  return (
    <div className="animate-fade-up">
      <StepHeader n={1} title="Select" em="Branch" sub="Which location would you like to visit?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 26 }}>
        {branches.map((b, i) => (
          <div key={b.id} className={`sel-card card-tap ${selected?.id === b.id ? 'selected' : ''}`}
            style={{ animation: `scaleIn 0.3s ${i * 0.1}s ease both` }}
            onClick={() => onSelect(b)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{b.area}</div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>🕐 {b.hours}</div>
                <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>📞 {b.phone}</div>
              </div>
              <CheckCircle checked={selected?.id === b.id} />
            </div>
            {b.map_url && (
              <a href={b.map_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 14, color: 'var(--gold-dark)', textDecoration: 'none', fontFamily: 'var(--font-outfit)', fontSize: 12, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(200,168,110,0.04)' }}>
                🗺 View on Map ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step: Services ─────────────────────────────────────────────────────────────
function ServicesStep({ services, selected, toggle, total, dur }: {
  services: Service[]; selected: Service[];
  toggle: (s: Service) => void; total: number; dur: number;
}) {
  return (
    <div className="animate-fade-up">
      <StepHeader n={2} title="Choose" em="Services" sub="Select one or more — multi-select enabled" />
      {selected.length > 0 && (
        <div style={{ background: 'rgba(200,168,110,0.08)', border: '1px solid rgba(200,168,110,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'scaleIn 0.25s ease' }}>
          <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13 }}>{selected.length} service{selected.length > 1 ? 's' : ''} · ~{dur} min</span>
          <span style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--gold)', fontSize: 22, fontWeight: 700 }}>₹{total}</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: selected.length > 0 ? 0 : 22 }}>
        {services.map((s, i) => {
          const sel = !!selected.find(x => x.id === s.id);
          return (
            <div key={s.id} className={`sel-card card-tap ${sel ? 'selected' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', animation: `fadeUp ${0.1 + i * 0.03}s ease both` }}
              onClick={() => toggle(s)}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: sel ? 'rgba(200,168,110,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, transition: 'all 0.2s' }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                  {s.is_popular && <span className="badge badge-gold">HOT</span>}
                </div>
                <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11 }}>{s.description} · {s.duration_minutes} min</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-cormorant)', color: sel ? 'var(--gold)' : 'var(--text)', fontSize: 20, fontWeight: 700, transition: 'color 0.2s' }}>₹{s.price}</div>
                <CheckCircle checked={sel} size={22} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step: Staff ────────────────────────────────────────────────────────────────
function StaffStep({ staff, selected, onSelect, services, branchName }: {
  staff: Staff[]; selected: Staff | null;
  onSelect: (s: Staff) => void; services: Service[]; branchName: string;
}) {
  return (
    <div className="animate-fade-up">
      <StepHeader n={3} title="Pick Your" em="Barber" sub={`Showing experts at ${branchName} for your selected services`} />
      {staff.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', marginTop: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div>
          <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 14 }}>No staff available for these services at this branch.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {staff.map((s, i) => {
          const sel = selected?.id === s.id;
          const svcNames = services.filter(sv => s.service_ids.includes(sv.id)).map(sv => sv.name);
          return (
            <div key={s.id} className={`sel-card card-tap ${sel ? 'selected' : ''}`}
              style={{ animation: `scaleIn 0.3s ${i * 0.08}s ease both` }}
              onClick={() => onSelect(s)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${s.avatar_color}, #3a2010)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontFamily: 'var(--font-outfit)', fontWeight: 700, fontSize: 18,
                  boxShadow: sel ? `0 4px 20px ${s.avatar_color}50` : 'none',
                  transition: 'box-shadow 0.2s',
                }}>
                  {initials(s.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{s.role}</div>
                  {s.bio && <div style={{ fontFamily: 'var(--font-outfit)', color: 'var(--dim)', fontSize: 11, marginTop: 3 }}>{s.bio}</div>}
                </div>
                <CheckCircle checked={sel} />
              </div>
              {svcNames.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {svcNames.map(n => <span key={n} className="badge badge-gray">{n}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step: Date ─────────────────────────────────────────────────────────────────
function DateStep({ dates, selected, onSelect }: { dates: DateOption[]; selected: DateOption | null; onSelect: (d: DateOption) => void }) {
  return (
    <div className="animate-fade-up">
      <StepHeader n={4} title="Pick a" em="Date" sub="Swipe to browse — next 21 days available" />
      <div className="scrollbar-hide" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 8, marginTop: 26 }}>
        {dates.map(d => {
          const sel = selected?.full === d.full;
          return (
            <div key={d.full} className="card-tap"
              onClick={() => onSelect(d)}
              style={{
                flexShrink: 0, width: 68, padding: '14px 6px', borderRadius: 16, textAlign: 'center',
                background: sel ? 'linear-gradient(160deg,#c8a86e,#7a5428)' : 'var(--card)',
                border: `1.5px solid ${sel ? 'var(--gold)' : 'var(--border)'}`,
                transition: 'all 0.2s', boxShadow: sel ? '0 8px 28px rgba(200,168,110,0.28)' : 'none',
              }}>
              <div style={{ fontFamily: 'var(--font-outfit)', color: sel ? 'rgba(0,0,0,0.65)' : 'var(--muted)', fontSize: 10 }}>{d.day}</div>
              <div style={{ fontFamily: 'var(--font-cormorant)', color: sel ? '#000' : 'var(--text)', fontSize: 28, fontWeight: 700, margin: '4px 0' }}>{d.date}</div>
              <div style={{ fontFamily: 'var(--font-outfit)', color: sel ? 'rgba(0,0,0,0.65)' : 'var(--muted)', fontSize: 10 }}>{d.month}</div>
              {d.isToday && <div style={{ fontFamily: 'var(--font-outfit)', color: sel ? 'rgba(0,0,0,0.5)' : 'var(--gold)', fontSize: 8, marginTop: 3 }}>TODAY</div>}
            </div>
          );
        })}
      </div>
      {selected && (
        <div style={{ marginTop: 18, background: 'rgba(200,168,110,0.07)', border: '1px solid rgba(200,168,110,0.2)', borderRadius: 12, padding: '13px 16px', animation: 'scaleIn 0.25s ease' }}>
          <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text)', fontSize: 13 }}>
            📅 {selected.day}, {selected.date} {selected.month}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Step: Time ─────────────────────────────────────────────────────────────────
function TimeStep({ times, selected, onSelect, bookings, duration, staffName, dateLabel }: {
  times: string[]; selected: string | null; onSelect: (t: string) => void;
  bookings: Booking[]; duration: number; staffName: string; dateLabel: string;
}) {
  return (
    <div className="animate-fade-up">
      <StepHeader n={5} title="Choose" em="Time Slot" sub={`Available slots for ${staffName} · ${dateLabel}`} />
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, marginBottom: 20, padding: '10px 14px', background: 'rgba(200,168,110,0.05)', borderRadius: 12, border: '1px solid rgba(200,168,110,0.12)' }}>
        {[
          ['var(--card)', 'var(--border)', 'Available'],
          ['rgba(239,68,68,0.07)', 'rgba(239,68,68,0.22)', 'Booked'],
          ['linear-gradient(135deg,#c8a86e,#8a6030)', 'var(--gold)', 'Selected'],
        ].map(([bg, border, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, background: bg, border: `1.5px solid ${border}`, borderRadius: 4, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
        {times.map((t, i) => {
          const blocked = isSlotBlocked(t, duration, bookings);
          const sel     = selected === t;
          return (
            <div key={t}
              className={`time-slot ${blocked ? 'blocked' : sel ? 'selected' : ''} ${!blocked ? 'card-tap' : ''}`}
              onClick={() => !blocked && onSelect(t)}
              style={{ animation: `scaleIn 0.2s ${i * 0.015}s ease both` }}>
              {t}
              {blocked && <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 8, marginTop: 2 }}>BOOKED</div>}
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 11, marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
        🔒 Slots blocked based on {staffName}'s bookings (~{duration} min)
      </p>
    </div>
  );
}

// ── Step: Details ──────────────────────────────────────────────────────────────
function DetailsStep({ state, update, totalPrice, totalDuration, errors }: {
  state: BookingState; update: (p: Partial<BookingState>) => void;
  totalPrice: number; totalDuration: number; errors: Record<string, string>;
}) {
  return (
    <div className="animate-fade-up">
      <StepHeader n={6} title="Your" em="Details" sub="Review your booking & confirm" />
      {/* Summary */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, marginBottom: 24, marginTop: 24 }}>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Booking Summary</p>
        {([
          ['📍 Branch',   state.branch?.area],
          ['✂️ Services',  state.services.map(s => s.name).join(' + ')],
          ['👤 Barber',   state.staff?.name],
          ['📅 Date',     state.date ? `${state.date.day}, ${state.date.date} ${state.date.month}` : ''],
          ['🕐 Time',     state.time],
          ['⏱ Duration', `~${totalDuration} min`],
          ['💰 Total',    `₹${totalPrice}`],
        ] as [string, string | undefined][]).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(200,168,110,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, flexShrink: 0 }}>{k}</span>
            <span style={{ fontFamily: 'var(--font-outfit)', color: k === '💰 Total' ? 'var(--gold)' : 'var(--text)', fontSize: k === '💰 Total' ? 17 : 13, fontWeight: k === '💰 Total' ? 700 : 400, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>
      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Full Name *" error={errors.name}>
          <input className={`input-field ${errors.name ? 'error' : ''}`} placeholder="Enter your full name"
            value={state.name} onChange={e => update({ name: e.target.value })} autoComplete="name" />
        </FormField>
        <FormField label="Mobile Number *" error={errors.phone}>
          <input className={`input-field ${errors.phone ? 'error' : ''}`} placeholder="10-digit mobile number"
            value={state.phone} onChange={e => update({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            type="tel" inputMode="numeric" autoComplete="tel" />
        </FormField>
        <FormField label="Note (Optional)">
          <textarea className="input-field" placeholder="Any specific requests..." value={state.note} onChange={e => update({ note: e.target.value })} />
        </FormField>
      </div>
      <div style={{ marginTop: 18, background: 'rgba(200,168,110,0.04)', border: '1px solid rgba(200,168,110,0.1)', borderRadius: 12, padding: '13px 15px', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
          Your info is private & secure. Used only for appointment confirmation. Payment at the salon.
        </p>
      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────
function StepHeader({ n, title, em, sub }: { n: number; title: string; em: string; sub: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--gold)', fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6 }}>Step {n} of {STEP_COUNT}</p>
      <h2 style={{ fontFamily: 'var(--font-cormorant)', color: '#fff', fontSize: 36, lineHeight: 1.1 }}>
        {title}<br /><em style={{ color: 'var(--gold)' }}>{em}</em>
      </h2>
      <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>{sub}</p>
    </div>
  );
}

function CheckCircle({ checked, size = 26 }: { checked: boolean; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${checked ? 'var(--gold)' : 'rgba(200,168,110,0.2)'}`, background: checked ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
      {checked && <span style={{ color: '#000', fontSize: size * 0.5, fontWeight: 700 }}>✓</span>}
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{label}</label>
      {children}
      {error && <p style={{ fontFamily: 'var(--font-outfit)', color: '#f87171', fontSize: 11, marginTop: 5 }}>{error}</p>}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <Image src="/logo.png" alt="Scissors" width={60} height={60} style={{ objectFit: 'contain', opacity: 0.6 }} />
      <div style={{ width: 32, height: 32, border: '2px solid rgba(200,168,110,0.2)', borderTop: '2px solid var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: 'var(--font-outfit)', color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
    </div>
  );
}
