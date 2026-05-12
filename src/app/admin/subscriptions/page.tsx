'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSubscriptionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const supabase = createClient()

  async function fetchData() {
    const [{ data: subs }, { data: studs }] = await Promise.all([
      supabase
        .from('subscription_status_view')
        .select('*')
        .order('end_date', { ascending: true }),
      supabase
        .from('students')
        .select('id, full_name, student_number')
        .eq('is_active', true)
        .order('full_name'),
    ])
    setSubscriptions(subs ?? [])
    setStudents(studs ?? [])
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.from('subscriptions').insert({
      student_id: fd.get('student_id'),
      plan_name:  fd.get('plan_name') || 'شهري',
      start_date: fd.get('start_date'),
      end_date:   fd.get('end_date'),
      amount:     fd.get('amount') ? Number(fd.get('amount')) : null,
      status:     'active',
      notes:      fd.get('notes') || null,
    })
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: 'حدث خطأ أثناء إضافة الاشتراك' }); return }
    setMsg({ type: 'success', text: '✅ تم إضافة الاشتراك بنجاح' })
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
    fetchData()
  }

  const statusColor = (s: string) => ({
    active:         { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)' },
    expiring_soon:  { bg: '#fff4e0',                        color: 'var(--color-warning)'  },
    expired:        { bg: '#fdecea',                        color: 'var(--color-error)'    },
  }[s] ?? { bg: 'var(--color-surface-offset)', color: 'var(--color-text-muted)' })

  const statusLabel = (s: string) => ({ active: 'نشط', expiring_soon: 'ينتهي قريبًا', expired: 'منتهي' }[s] ?? s)

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>الاشتراكات</h2>
        <button onClick={() => { setShowForm(!showForm); setMsg(null) }} style={{
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
          padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
        }}>
          {showForm ? '✕ إلغاء' : '+ إضافة اشتراك'}
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
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>بيانات الاشتراك الجديد</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                الطالب <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select name="student_id" required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="">اختر الطالب...</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.full_name} — {s.student_number}</option>
                ))}
              </select>
            </div>

            {[
              { name: 'plan_name',  label: 'نوع الخطة',       type: 'text', placeholder: 'شهري / فصلي / سنوي', required: false },
              { name: 'amount',     label: 'المبلغ (ريال)',    type: 'number', placeholder: '500', required: false },
              { name: 'start_date', label: 'تاريخ البدء',      type: 'date', placeholder: '', required: true },
              { name: 'end_date',   label: 'تاريخ الانتهاء',   type: 'date', placeholder: '', required: true },
            ].map(f => (
              <div key={f.name} style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                  {f.label} {f.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                </label>
                <input name={f.name} type={f.type} placeholder={f.placeholder}
                  defaultValue={f.type === 'date' ? today : ''}
                  required={f.required}
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                    padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
              </div>
            ))}

            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ملاحظات</label>
              <textarea name="notes" rows={2} placeholder="أي ملاحظات إضافية..."
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)', resize: 'vertical' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)',
              justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', fontWeight: 700 }}>
                إلغاء
              </button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)',
                  borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الحفظ...' : 'حفظ الاشتراك'}
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
                {['الطالب','الخطة','تاريخ البدء','تاريخ الانتهاء','الأيام المتبقية','المبلغ','الحالة'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700,
                    whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>
                  لا يوجد اشتراكات بعد
                </td></tr>
              )}
              {subscriptions.map((s: any) => {
                const sc = statusColor(s.computed_status)
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                      {s.student_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      {s.plan_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-muted)' }}>
                      {s.start_date}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-muted)' }}>
                      {s.end_date}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 800,
                      color: s.days_remaining <= 7 ? 'var(--color-warning)' : 'var(--color-success)',
                      fontVariantNumeric: 'tabular-nums' }}>
                      {s.days_remaining} يوم
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontVariantNumeric: 'tabular-nums' }}>
                      {s.amount ? `${s.amount} ر.س` : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ background: sc.bg, color: sc.color,
                        padding: '.3rem .8rem', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {statusLabel(s.computed_status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}