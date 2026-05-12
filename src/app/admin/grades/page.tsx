'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminGradesPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [grades, setGrades] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const supabase = createClient()

  async function fetchData() {
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from('grades')
        .select('*, students(full_name, student_number)')
        .order('exam_date', { ascending: false }),
      supabase.from('students').select('id, full_name, student_number')
        .eq('is_active', true).order('full_name'),
    ])
    setGrades(g ?? [])
    setStudents(s ?? [])
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.from('grades').insert({
      student_id: fd.get('student_id'),
      subject:    fd.get('subject'),
      exam_name:  fd.get('exam_name'),
      score:      Number(fd.get('score')),
      max_score:  Number(fd.get('max_score')) || 100,
      exam_date:  fd.get('exam_date'),
      notes:      fd.get('notes') || null,
    })
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: 'حدث خطأ أثناء إضافة الدرجة' }); return }
    setMsg({ type: 'success', text: '✅ تم إضافة الدرجة بنجاح' })
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
    fetchData()
  }

  function gradeColor(score: number, max: number) {
    const pct = (score / max) * 100
    if (pct >= 90) return 'var(--color-success)'
    if (pct >= 75) return 'var(--color-primary)'
    if (pct >= 60) return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  const subjects = ['رياضيات','لغة عربية','لغة إنجليزية','علوم','تاريخ','جغرافيا','تربية إسلامية','حاسب','فيزياء','كيمياء','أحياء']
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1000 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>الدرجات</h2>
        <button onClick={() => { setShowForm(!showForm); setMsg(null) }} style={{
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
          padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
        }}>
          {showForm ? '✕ إلغاء' : '+ إضافة درجة'}
        </button>
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
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>إضافة درجة جديدة</h3>
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

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                المادة <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select name="subject" required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="">اختر المادة...</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                اسم الاختبار <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input name="exam_name" type="text" placeholder="مثال: اختبار الفصل الأول" required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                الدرجة <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input name="score" type="number" min="0" max="1000" placeholder="85" required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الدرجة الكاملة</label>
              <input name="max_score" type="number" min="1" placeholder="100" defaultValue="100"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                تاريخ الاختبار <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input name="exam_date" type="date" defaultValue={today} required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ملاحظات</label>
              <textarea name="notes" rows={2} placeholder="أي ملاحظات..."
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)', resize: 'vertical' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)',
              justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', fontWeight: 700 }}>إلغاء</button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)',
                  borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الحفظ...' : 'حفظ الدرجة'}
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
                {['الطالب','المادة','الاختبار','الدرجة','التاريخ','ملاحظات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700,
                    whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>لا توجد درجات بعد</td></tr>
              )}
              {grades.map((g: any) => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    {g.students?.full_name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                    {g.subject}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                    {g.exam_name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                      color: gradeColor(g.score, g.max_score) }}>
                      {g.score}
                    </span>
                    <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
                      /{g.max_score}
                    </span>
                    <span style={{ marginRight: 'var(--space-2)', fontSize: 'var(--text-xs)',
                      color: gradeColor(g.score, g.max_score) }}>
                      ({Math.round((g.score / g.max_score) * 100)}%)
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)' }}>{g.exam_date}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)' }}>{g.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}