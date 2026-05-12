'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ParentProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const newPass   = fd.get('new_password') as string
    const confirmPass = fd.get('confirm_password') as string

    if (newPass !== confirmPass) {
      setMsg({ type: 'error', text: 'كلمة المرور غير متطابقة' })
      setLoading(false)
      return
    }
    if (newPass.length < 8) {
      setMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
      setLoading(false)
      return
    }

    const res = await fetch('/api/parent/change-password', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPass }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: '✅ تم تغيير كلمة المرور بنجاح' });
    (e.target as HTMLFormElement).reset()
  }

  const card: any = { background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)',
    marginBottom: 'var(--space-6)' }

  const inputStyle: any = { border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
    padding: '.85rem 1rem', borderRadius: 'var(--radius-md)', width: '100%' }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 600 }}>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
        الملف الشخصي
      </h2>

      {/* بيانات الحساب */}
      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)', fontSize: 'var(--text-lg)' }}>
          بيانات الحساب
        </h3>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {[
            { label: 'الاسم الكامل',     value: profile?.full_name },
            { label: 'اسم المستخدم',     value: profile?.username  },
            { label: 'رقم الجوال',       value: profile?.phone ?? '—' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{f.label}</span>
              <strong>{f.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* تغيير كلمة المرور */}
      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)', fontSize: 'var(--text-lg)' }}>
          تغيير كلمة المرور
        </h3>

        {msg && (
          <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)',
            background: msg.type === 'success' ? 'var(--color-primary-highlight)' : '#fdecea',
            border: `1px solid ${msg.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'}`,
            color: msg.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)',
            borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handlePassword} style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
              كلمة المرور الجديدة *
            </label>
            <input name="new_password" type="password" required minLength={8}
              placeholder="8 أحرف على الأقل" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
              تأكيد كلمة المرور *
            </label>
            <input name="confirm_password" type="password" required minLength={8}
              placeholder="أعد كتابة كلمة المرور" style={inputStyle} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
              color: 'var(--color-text-inverse)', padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
            {loading ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  )
}