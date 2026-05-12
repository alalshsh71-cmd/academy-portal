'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminParentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [parents, setParents] = useState<any[]>([])
  const [fetched, setFetched] = useState(false)

  const supabase = createClient()

  async function fetchParents() {
    const { data } = await supabase
      .from('parents')
      .select('id, profile_id, profiles(full_name, username, phone, is_active, created_at)')
      .order('created_at', { referencedTable: 'profiles', ascending: false })
    setParents(data ?? [])
    setFetched(true)
  }

  if (!fetched) fetchParents()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/admin/create-parent', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fd.get('full_name'),
        username: fd.get('username'),
        phone: fd.get('phone'),
        password: fd.get('password'),
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setMsg({ type: 'error', text: data.error }); return }
    setMsg({ type: 'success', text: `✅ تم إنشاء الحساب بنجاح` })
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
    fetchParents()
  }

  async function toggleActive(profileId: string, current: boolean) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', profileId)
    fetchParents()
  }

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>أولياء الأمور</h2>
        <button onClick={() => { setShowForm(!showForm); setMsg(null) }} style={{
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
          padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
        }}>
          {showForm ? '✕ إلغاء' : '+ إنشاء حساب جديد'}
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ ...card, marginBottom: 'var(--space-5)',
          background: msg.type === 'success' ? 'var(--color-primary-highlight)' : '#fdecea',
          border: `1px solid ${msg.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'}`,
          color: msg.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)',
          fontWeight: 700 }}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ ...card, marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>بيانات ولي الأمر الجديد</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[
              { name: 'full_name',  label: 'الاسم الكامل',         placeholder: 'محمد أحمد العمري',  type: 'text',     required: true },
              { name: 'username',   label: 'اسم المستخدم (الجوال)', placeholder: '05xxxxxxxx',         type: 'text',     required: true },
              { name: 'phone',      label: 'رقم الجوال',            placeholder: '05xxxxxxxx',         type: 'text',     required: false },
              { name: 'password',   label: 'كلمة المرور المؤقتة',   placeholder: 'مثال: Aa@12345',     type: 'password', required: true },
            ].map(f => (
              <div key={f.name} style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                  {f.label} {f.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                </label>
                <input name={f.name} type={f.type} placeholder={f.placeholder} required={f.required}
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                    padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', fontWeight: 700 }}>
                إلغاء
              </button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)',
                  borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-divider)' }}>
                {['الاسم', 'اسم المستخدم', 'رقم الجوال', 'تاريخ الإنشاء', 'الحالة', 'إجراء'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parents.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>
                  لا يوجد أولياء أمور بعد — أنشئ أول حساب
                </td></tr>
              )}
              {parents.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                  <td style={{ padding: 'var(--space-4)', fontWeight: 700 }}>
                    {p.profiles?.full_name}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace',
                    color: 'var(--color-text-muted)' }}>
                    {p.profiles?.username}
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                    {p.profiles?.phone ?? '—'}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)' }}>
                    {new Date(p.profiles?.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{
                      background: p.profiles?.is_active ? 'var(--color-primary-highlight)' : '#fdecea',
                      color: p.profiles?.is_active ? 'var(--color-primary)' : 'var(--color-error)',
                      padding: '.3rem .8rem', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)', fontWeight: 700
                    }}>
                      {p.profiles?.is_active ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <button onClick={() => toggleActive(p.profile_id, p.profiles?.is_active)}
                      style={{ fontSize: 'var(--text-sm)', fontWeight: 700,
                        color: p.profiles?.is_active ? 'var(--color-error)' : 'var(--color-primary)',
                        padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                        border: `1px solid ${p.profiles?.is_active ? 'var(--color-error)' : 'var(--color-primary)'}` }}>
                      {p.profiles?.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}