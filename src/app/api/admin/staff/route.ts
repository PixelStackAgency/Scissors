import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const pwd = req.headers.get('x-admin-password') || '';
  if (pwd !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payload = {
      ...body,
      staff_code: body.staff_code ?? 'ST' + Date.now(),
    };

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('staff')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin.from('staff').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
