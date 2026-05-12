'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminAttendancePage() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  async function fetchData() {
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from('attendance').select('*, students(full_name)')
        .eq('date', date).order('created_at', { ascending: false }),
      supabase.from('students').select('id, full_name, student_number')
        .eq('is_active', true).order('full_name'),
    ])
    setRecords(r ?? [])
    setStudents(s ?? [])
  }

  useEffect(() => { fetchData() }, [date])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.from('attendance').upsert({
      student_id: fd.get('student_id'),
      date:       date,
      status:     fd.get('status'),
      notes:      fd.get('notes') || null,
    }, { onConflict: 'student_id,date' })
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: 'حدث خطأ أثناء التسجيل' }); return }
    setMsg({ type: 'success', text: '✅ تم تسجيل الحضور بنجاح' })
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
    fetchData()
  }

  const statusStyle = (s: string) => ({
    present: { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)', label: 'حاضر'  },
    absent:  { bg: '#fdecea',                        color: 'var(--color-error)',   label: 'غائب'   },
    late:    { bg: '#fff4e0',                        color: 'var(--color-warning)', label: 'متأخر'  },
    excused: { bg: 'var(--color-surface-offset)',    color: 'var(--color-text-muted)', label: 'إجازة' },
  }[s] ?? { bg: 'var(--color-surface-offset)', color: 'var(--color-text-muted)', label: s })

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const late    = records.filter(r => r.status === 'late').length

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>الحضور والغياب</h2>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', fontWeight: 600 }} />
          <button onClick={() => { setShowForm(!showForm); setMsg(null) }} style={{
            background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
            padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
          }}>{showForm ? '✕ إلغاء' : '+ تسجيل حضور'}</button>
        </div>
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'حاضر',  value: present, color: 'var(--color-success)' },
            { label: 'غائب',  value: absent,  color: 'var(--color-error)'   },
            { label: 'متأخر', value: late,    color: 'var(--color-warning)'  },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

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
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>
            تسجيل حضور — {date}
          </h3>
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
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الحالة *</label>
              <select name="status" required style={{ border: '1px solid var(--color-border)',
                background: 'var(--color-surface-2)', padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="present">حاضر</option>
                <option value="absent">غائب</option>
                <option value="late">متأخر</option>
                <option value="excused">إجازة</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ملاحظات</label>
              <input name="notes" type="text" placeholder="أي ملاحظات..."
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', fontWeight: 700 }}>إلغاء</button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)',
                  borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الحفظ...' : 'تسجيل'}
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
                {['الطالب','التاريخ','الحالة','ملاحظات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>لا يوجد سجلات لهذا اليوم</td></tr>
              )}
              {records.map((r: any) => {
                const ss = statusStyle(r.status)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                      {r.students?.full_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)' }}>{r.date}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ background: ss.bg, color: ss.color, padding: '.3rem .8rem',
                        borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        {ss.label}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-muted)' }}>{r.notes ?? '—'}</td>
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