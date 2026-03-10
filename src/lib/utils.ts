// src/lib/utils.ts
import { supabase } from './supabase';
import type { Branch, Service, Staff, Booking, BookingStatus } from '@/types';

// ── Time helpers ──────────────────────────────────────────────────────────────
export function timeToMin(t: string): number {
  const [time, period] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export const ALL_TIMES = [
  '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM',
];

// Check if a time slot is blocked given existing bookings
// A slot is blocked if: new booking's [slotStart, slotStart+slotDuration] 
// overlaps with any existing booking [bookingStart, bookingStart+bookingDuration]
export function isSlotBlocked(
  slot: string,
  durationMinutes: number,
  bookings: Booking[],
): boolean {
  const slotStart = timeToMin(slot);
  const slotEnd   = slotStart + Math.max(durationMinutes, 30);

  return bookings.some(b => {
    if (b.status !== 'confirmed') return false;
    const bStart = b.time_minutes;
    const bEnd   = bStart + b.duration_minutes;
    return slotStart < bEnd && slotEnd > bStart;
  });
}

// Generate next N days from today
export function getDates(n = 21) {
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day:     DAYS[d.getDay()],
      date:    d.getDate(),
      month:   MONTHS[d.getMonth()],
      full:    d.toISOString().split('T')[0],
      isToday: i === 0,
    };
  });
}

// Generate short booking reference
export function genRef(): string {
  return 'SC' + Math.floor(100000 + Math.random() * 900000).toString();
}

export function fmtINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Supabase Data Fetchers ────────────────────────────────────────────────────

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .order('id');
  if (error) throw error;
  return data as Branch[];
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Service[];
}

export async function fetchStaff(branchId?: number): Promise<Staff[]> {
  let q = supabase.from('staff').select('*').eq('is_active', true);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q.order('name');
  if (error) throw error;
  return data as Staff[];
}

export async function fetchBookingsForSlot(
  branchId: number,
  staffId: string,
  date: string,
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_date', date)
    .eq('status', 'confirmed')
    .or(`branch_id.eq.${branchId},staff_id.eq.${staffId}`);
  if (error) throw error;
  return data as Booking[];
}

export async function fetchAllBookings(filters?: {
  branchId?: number;
  status?: BookingStatus;
  date?: string;
  search?: string;
}): Promise<Booking[]> {
  let q = supabase
    .from('bookings')
    .select('*, branch:branches(*), staff:staff(*)')
    .order('created_at', { ascending: false });

  if (filters?.branchId)  q = q.eq('branch_id', filters.branchId);
  if (filters?.status)    q = q.eq('status', filters.status);
  if (filters?.date)      q = q.eq('booking_date', filters.date);
  if (filters?.search) {
    q = q.or(
      `customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,booking_ref.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return data as Booking[];
}

export async function createBooking(payload: {
  booking_ref:      string;
  branch_id:        number;
  staff_id:         string;
  customer_name:    string;
  customer_phone:   string;
  note:             string;
  booking_date:     string;
  time_str:         string;
  time_minutes:     number;
  duration_minutes: number;
  total_price:      number;
  services:         { id: number; name: string; price: number; duration_minutes: number }[];
}): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
}

// helper used by admin UI to call our serverless endpoints
async function callAdminApi(path: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-admin-password': process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '',
    ...(options.headers || {}),
  };
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    let text;
    try { text = await res.text(); }
    catch { text = res.statusText; }
    throw new Error(`Admin API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<void> {
  await callAdminApi('/api/admin/bookings', {
    method: 'PATCH',
    body: JSON.stringify({ id, status }),
  });
}

export async function upsertStaff(member: Partial<Staff> & { name: string; role: string }): Promise<Staff> {
  const payload = {
    ...member,
    staff_code: member.staff_code ?? ('ST' + Date.now()),
  };
  return await callAdminApi('/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteStaffMember(id: string): Promise<void> {
  await callAdminApi('/api/admin/staff', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function upsertService(svc: Partial<Service> & { name: string; price: number; duration_minutes: number }): Promise<Service> {
  return await callAdminApi('/api/admin/services', {
    method: 'POST',
    body: JSON.stringify(svc),
  });
}

export async function deleteService(id: number): Promise<void> {
  await callAdminApi('/api/admin/services', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
