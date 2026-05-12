'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminStudentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const supabase = createClient()

  async function fetchStudents() {
    const { data } = await supabase
      .from('students')
      .select('*, parent_students(parents(profiles(full_name)))')
      .order('created_at', { ascending: false })
    setStudents(data ?? [])
  }

  async function fetchParents() {
    const { data } = await supabase
      .from('parents')
      .select('id, profiles(full_name)')
    setParents(data ?? [])
  }

  useEffect(() => { fetchStudents(); fetchParents() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)

    const { data: student, error } = await supabase
      .from('students')
      .insert({
        full_name:     fd.get('full_name'),
        date_of_birth: fd.get('date_of_birth') || null,
        grade:         fd.get('grade') || null,
        group_name:    fd.get('group_name') || null,
        gender:        fd.get('gender') || null,
      })
      .select()
      .single()

    if (error || !student) {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء إضافة الطالب' })
      setLoading(false)
      return
    }

    const parentId = fd.get('parent_id') as string
    if (parentId) {
      await supabase.from('parent_students').insert({
        parent_id:  parentId,
        student_id: student.id,
        is_primary: true,
      })
    }

    setMsg({ type: 'success', text: `✅ تم إضافة الطالب بنجاح — رقمه: ${student.student_number}` })
    setShowForm(false);
    (e.target as HTMLFormElement).reset()
    fetchStudents()
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('students').update({ is_active: !current }).eq('id', id)
    fetchStudents()
  }

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  const grades = ['KG1','KG2','الأول','الثاني','الثالث','الرابع','الخامس','السادس',
    'السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر']

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>الطلاب</h2>
        <button onClick={() => { setShowForm(!showForm); setMsg(null) }} style={{
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
          padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
        }}>
          {showForm ? '✕ إلغاء' : '+ إضافة طالب'}
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
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>بيانات الطالب الجديد</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

            {/* الاسم */}
            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                الاسم الكامل <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input name="full_name" type="text" placeholder="اسم الطالب كاملًا" required
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            {/* تاريخ الميلاد */}
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>تاريخ الميلاد</label>
              <input name="date_of_birth" type="date"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            {/* الجنس */}
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الجنس</label>
              <select name="gender"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            {/* الصف */}
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الصف الدراسي</label>
              <select name="grade"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="">اختر الصف...</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* المجموعة */}
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>المجموعة</label>
              <input name="group_name" type="text" placeholder="مثال: مجموعة أ"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
            </div>

            {/* ولي الأمر */}
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ولي الأمر</label>
              <select name="parent_id"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <option value="">اختر ولي الأمر...</option>
                {parents.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
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
                {loading ? 'جارٍ الإضافة...' : 'إضافة الطالب'}
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
                {['رقم الطالب','الاسم','الصف','المجموعة','الجنس','ولي الأمر','الحالة','إجراء'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700,
                    whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>
                  لا يوجد طلاب بعد — أضف أول طالب
                </td></tr>
              )}
              {students.map((s: any) => {
                const parentName = s.parent_students?.[0]?.parents?.profiles?.full_name
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace',
                      fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      {s.student_number}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                      {s.full_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      {s.grade ?? '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      {s.group_name ?? '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      {s.gender === 'male' ? 'ذكر' : s.gender === 'female' ? 'أنثى' : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                      {parentName ?? <span style={{ color: 'var(--color-text-faint)' }}>غير مربوط</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{
                        background: s.is_active ? 'var(--color-primary-highlight)' : '#fdecea',
                        color: s.is_active ? 'var(--color-primary)' : 'var(--color-error)',
                        padding: '.3rem .8rem', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)', fontWeight: 700
                      }}>
                        {s.is_active ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <button onClick={() => toggleActive(s.id, s.is_active)}
                        style={{ fontSize: 'var(--text-sm)', fontWeight: 700,
                          color: s.is_active ? 'var(--color-error)' : 'var(--color-primary)',
                          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                          border: `1px solid ${s.is_active ? 'var(--color-error)' : 'var(--color-primary)'}`,
                          whiteSpace: 'nowrap' }}>
                        {s.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>
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