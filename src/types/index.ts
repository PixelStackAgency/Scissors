// src/types/index.ts

export interface Branch {
  id: number;
  name: string;
  area: string;
  city: string;
  phone: string;
  hours: string;
  map_url: string | null;
  is_active: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  icon: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Staff {
  id: string;
  staff_code: string;
  name: string;
  role: string;
  branch_id: number;
  phone: string | null;
  bio: string | null;
  avatar_color: string;
  service_ids: number[];
  is_active: boolean;
  join_date: string;
  created_at: string;
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface BookingService {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

export interface Booking {
  id: string;
  booking_ref: string;
  branch_id: number;
  staff_id: string | null;
  customer_name: string;
  customer_phone: string;
  note: string;
  booking_date: string;       // "YYYY-MM-DD"
  time_str: string;           // "1:00 PM"
  time_minutes: number;       // minutes from midnight
  duration_minutes: number;
  total_price: number;
  status: BookingStatus;
  services: BookingService[];
  created_at: string;
  updated_at: string;
  // joined
  branch?: Branch;
  staff?: Staff;
}

// Booking wizard state
export interface BookingState {
  branch:   Branch | null;
  services: Service[];
  staff:    Staff | null;
  date:     DateOption | null;
  time:     string | null;
  name:     string;
  phone:    string;
  note:     string;
}

export interface DateOption {
  day:     string;   // "Mon"
  date:    number;   // 15
  month:   string;   // "Jan"
  full:    string;   // "2025-01-15"
  isToday: boolean;
}

export type BookingStep = 0 | 1 | 2 | 3 | 4 | 5;
// 0=Branch, 1=Services, 2=Staff, 3=Date, 4=Time, 5=Details
