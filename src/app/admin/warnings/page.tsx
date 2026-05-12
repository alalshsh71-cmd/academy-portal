'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminWarningsPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [warnings, setWarnings] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const supabase = createClient()

  async function fetchData() {
    const [{ data: w }, { data: s }] = await Promise.all([
      supabase.from('warnings').select('*, students(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name, student_number')
        .eq('is_active', true).order('full_name'),
    ])
    setWarnings(w ?? [])
    setStudents(s ?? [])
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.from('warnings').insert({
      student_id:  fd.get('student_id'),
      title:       fd.get('title'),
      description: fd.get('description') || null,
      level:       fd.get('level'),
    })
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: 'حدث خطأ أثناء إضافة الإنذار' }); return }
    setMsg({ type: 'success', text: '✅ تم إضافة الإنذار بنجاح' })
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
    fetchData()
  }

  async function resolve(id: string) {
    await supabase.from('warnings').update({
      is_resolved: true, resolved_at: new Date().toISOString()
    }).eq('id', id)
    fetchData()
  }

  const levelStyle = (l: string) => ({
    info:     { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)',  label: 'معلومة'  },
    warning:  { bg: '#fff4e0',                        color: 'var(--color-warning)',  label: 'تحذير'   },
    critical: { bg: '#fdecea',                        color: 'var(--color-error)',    label: 'حرج'     },
  }[l] ?? { bg: 'var(--color-surface-offset)', color: 'var(--color-text-muted)', label: l })

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>الإنذارات</h2>
        <button onClick={() => { setShowForm(!showForm); setMsg(null) }} style={{
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
          padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
        }}>{showForm ? '✕ إلغاء' : '+ إضافة إنذار'}</button>
      </div>

      {msg && (
        <div style={{ ...card, marginBottom: 'var(--space-5)',
          background: msg.type === 'success' ? 'var(--color-primary-highlight)' : '#fdecea',
          border: `1px solid ${msg.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'}`,
          color: msg.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)', fontWeight: 700 }}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <div style={{ ...card, marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>إضافة إنذار جديد</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الطالب *</label>
              <select name="student_id" required style={{ border: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)', padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="">اختر الطالب...</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>مستوى الإنذار *</label>
              <select name="level" required style={{ border: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)', padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="info">معلومة</option>
                <option value="warning">تحذير</option>
                <option value="critical">حرج</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>عنوان الإنذار *</label>
              <input name="title" type="text" placeholder="مثال: غياب متكرر" required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>التفاصيل</label>
              <textarea name="description" rows={3} placeholder="تفاصيل الإنذار..."
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)', resize: 'vertical' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', fontWeight: 700 }}>إلغاء</button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)',
                  borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الحفظ...' : 'حفظ الإنذار'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-divider)' }}>
                {['الطالب','العنوان','المستوى','التاريخ','الحالة','إجراء'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {warnings.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>لا توجد إنذارات</td></tr>
              )}
              {warnings.map((w: any) => {
                const ls = levelStyle(w.level)
                return (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--color-divider)',
                    opacity: w.is_resolved ? 0.5 : 1 }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                      {w.students?.full_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 600 }}>{w.title}</div>
                      {w.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                        marginTop: 'var(--space-1)' }}>{w.description}</div>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ background: ls.bg, color: ls.color, padding: '.3rem .8rem',
                        borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        {ls.label}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-muted)' }}>
                      {new Date(w.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ background: w.is_resolved ? 'var(--color-primary-highlight)' : '#fff4e0',
                        color: w.is_resolved ? 'var(--color-primary)' : 'var(--color-warning)',
                        padding: '.3rem .8rem', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        {w.is_resolved ? 'مُحلول' : 'مفتوح'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {!w.is_resolved && (
                        <button onClick={() => resolve(w.id)}
                          style={{ fontSize: 'var(--text-sm)', fontWeight: 700,
                            color: 'var(--color-success)', padding: 'var(--space-2) var(--space-4)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)' }}>
                          تم الحل ✓
                        </button>
                      )}
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