'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) redirect('/login?error=جميع الحقول مطلوبة')

  const supabase = await createClient()
  const email = `${username}@academy.local`

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) redirect('/login?error=اسم المستخدم أو كلمة المرور غير صحيحة')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, must_change_password, is_active')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login?error=الحساب غير مكتمل تواصل مع الإدارة')
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=الحساب موقوف تواصل مع الإدارة')
  }

  if (profile.must_change_password) redirect('/change-password')
  if (profile.role === 'admin') redirect('/admin/dashboard')
  redirect('/parent/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function changePassword(formData: FormData) {
  const newPassword     = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (newPassword !== confirmPassword)
    redirect('/change-password?error=كلمتا المرور غير متطابقتين')
  if (newPassword.length < 8)
    redirect('/change-password?error=كلمة المرور يجب أن تكون 8 أحرف على الأقل')

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) redirect('/change-password?error=حدث خطأ أثناء تغيير كلمة المرور')

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    revalidatePath('/')
    if (profile?.role === 'admin') redirect('/admin/dashboard')
    redirect('/parent/dashboard')
  }

  redirect('/login')
}

export async function createParentAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'غير مصرح' }

  const admin    = createAdminClient()
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const phone    = formData.get('phone') as string
  const email    = `${username}@academy.local`

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true
  })
  if (authError || !newUser.user) return { error: authError?.message || 'خطأ في إنشاء الحساب' }

  await admin.from('profiles').insert({
    id: newUser.user.id, role: 'parent',
    full_name, username, phone,
    must_change_password: true, created_by: user.id
  })
  await admin.from('parents').insert({ profile_id: newUser.user.id })

  revalidatePath('/admin/parents')
  return { success: true, message: `تم إنشاء الحساب: ${username}` }
}