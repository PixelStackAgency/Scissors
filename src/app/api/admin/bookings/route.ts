import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password') || '';
  if (pwd !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return false;
  }
  return true;
}

// PATCH is easier to express status updates
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    const admin = getAdminClient();
    const { error } = await admin.from('bookings').update({ status }).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
