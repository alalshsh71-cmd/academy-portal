import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { new_password } = await req.json()
    if (!new_password || new_password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { error } = await supabase.auth.updateUser({ password: new_password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // تحديث الحالة في جدول profiles
    await supabase.from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}