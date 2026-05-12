'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminStudentsPage() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
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

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditLoading(true)
    const fd = new FormData(e.currentTarget)

    const { error } = await supabase
      .from('students')
      .update({
        full_name:     fd.get('full_name'),
        date_of_birth: fd.get('date_of_birth') || null,
        grade:         fd.get('grade') || null,
        group_name:    fd.get('group_name') || null,
        gender:        fd.get('gender') || null,
      })
      .eq('id', editStudent.id)

    if (error) {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء تعديل بيانات الطالب' })
      setEditLoading(false)
      return
    }

    // تحديث ولي الأمر
    const parentId = fd.get('parent_id') as string
    if (parentId) {
      await supabase.from('parent_students').delete().eq('student_id', editStudent.id)
      await supabase.from('parent_students').insert({
        parent_id:  parentId,
        student_id: editStudent.id,
        is_primary: true,
      })
    }

    setMsg({ type: 'success', text: '✅ تم تعديل بيانات الطالب بنجاح' })
    setEditStudent(null)
    fetchStudents()
    setEditLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('students').update({ is_active: !current }).eq('id', id)
    fetchStudents()
  }

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
    padding: '.85rem 1rem', borderRadius: 'var(--radius-md)', width: '100%'
  }

  const grades = ['KG1','KG2','الأول','الثاني','الثالث','الرابع','الخامس','السادس',
    'السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر']

  // إيجاد ولي الأمر الحالي للطالب المحدد
  const currentParentId = editStudent?.parent_students?.[0]?.parents?.id ?? ''

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

      {/* Form إضافة */}
      {showForm && (
        <div style={{ ...card, marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>بيانات الطالب الجديد</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الاسم الكامل <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input name="full_name" type="text" placeholder="اسم الطالب كاملًا" required style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>تاريخ الميلاد</label>
              <input name="date_of_birth" type="date" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الجنس</label>
              <select name="gender" style={inputStyle}>
                <option value="">اختر...</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الصف الدراسي</label>
              <select name="grade" style={inputStyle}>
                <option value="">اختر الصف...</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>المجموعة</label>
              <input name="group_name" type="text" placeholder="مثال: مجموعة أ" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ولي الأمر</label>
              <select name="parent_id" style={inputStyle}>
                <option value="">اختر ولي الأمر...</option>
                {parents.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontWeight: 700 }}>
                إلغاء
              </button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)', color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الإضافة...' : 'إضافة الطالب'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal تعديل */}
      {editStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 'var(--space-4)'
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)', width: '100%', maxWidth: 600,
            boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>تعديل بيانات الطالب</h3>
              <button onClick={() => setEditStudent(null)}
                style={{ fontSize: '1.4rem', color: 'var(--color-text-muted)', lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={handleEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

              {/* الاسم */}
              <div style={{ display: 'grid', gap: 'var(--space-2)', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الاسم الكامل *</label>
                <input name="full_name" type="text" required defaultValue={editStudent.full_name} style={inputStyle} />
              </div>

              {/* تاريخ الميلاد */}
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>تاريخ الميلاد</label>
                <input name="date_of_birth" type="date" defaultValue={editStudent.date_of_birth ?? ''} style={inputStyle} />
              </div>

              {/* الجنس */}
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الجنس</label>
                <select name="gender" defaultValue={editStudent.gender ?? ''} style={inputStyle}>
                  <option value="">اختر...</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              {/* الصف */}
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>الصف الدراسي</label>
                <select name="grade" defaultValue={editStudent.grade ?? ''} style={inputStyle}>
                  <option value="">اختر الصف...</option>
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* المجموعة */}
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>المجموعة</label>
                <input name="group_name" type="text" defaultValue={editStudent.group_name ?? ''} style={inputStyle} />
              </div>

              {/* ولي الأمر */}
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ولي الأمر</label>
                <select name="parent_id" defaultValue={currentParentId} style={inputStyle}>
                  <option value="">اختر ولي الأمر...</option>
                  {parents.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.profiles?.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setEditStudent(null)}
                  style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontWeight: 700 }}>
                  إلغاء
                </button>
                <button type="submit" disabled={editLoading}
                  style={{ background: editLoading ? 'var(--color-text-faint)' : 'var(--color-primary)', color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                  {editLoading ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-divider)' }}>
                {['رقم الطالب','الاسم','الصف','المجموعة','الجنس','ولي الأمر','الحالة','إجراءات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
                  لا يوجد طلاب بعد — أضف أول طالب
                </td></tr>
              )}
              {students.map((s: any) => {
                const parentName = s.parent_students?.[0]?.parents?.profiles?.full_name
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      {s.student_number}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>{s.full_name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>{s.grade ?? '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>{s.group_name ?? '—'}</td>
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
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {/* زر تعديل */}
                        <button onClick={() => { setEditStudent(s); setMsg(null) }}
                          style={{ fontSize: 'var(--text-sm)', fontWeight: 700,
                            color: 'var(--color-primary)', padding: 'var(--space-2) var(--space-4)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)',
                            whiteSpace: 'nowrap' }}>
                          ✏️ تعديل
                        </button>
                        {/* زر إيقاف/تفعيل */}
                        <button onClick={() => toggleActive(s.id, s.is_active)}
                          style={{ fontSize: 'var(--text-sm)', fontWeight: 700,
                            color: s.is_active ? 'var(--color-error)' : 'var(--color-primary)',
                            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${s.is_active ? 'var(--color-error)' : 'var(--color-primary)'}`,
                            whiteSpace: 'nowrap' }}>
                          {s.is_active ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </div>
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