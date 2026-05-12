'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ParentNotes() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const [notes, setNotes] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const supabase = createClient()

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: parent } = await supabase.from('parents').select('id').eq('profile_id', user.id).single()
    const { data: link } = await supabase.from('parent_students')
      .select('id').eq('parent_id', parent?.id).eq('student_id', studentId).single()
    if (!link) { router.push('/parent/dashboard'); return }
    const { data: s } = await supabase.from('students').select('full_name').eq('id', studentId).single()
    setStudent(s)
    fetchNotes()
  }

  async function fetchNotes() {
    const { data } = await supabase.from('student_notes')
      .select('*').eq('student_id', studentId).order('created_at', { ascending: false })
    setNotes(data ?? [])
  }

  useEffect(() => { checkAccess() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const payload = {
      student_id: studentId,
      category:   fd.get('category'),
      title:      fd.get('title'),
      content:    fd.get('content'),
    }
    const { error } = editId
      ? await supabase.from('student_notes').update(payload).eq('id', editId)
      : await supabase.from('student_notes').insert(payload)
    setLoading(false)
    if (error) { setMsg({ type: 'error', text: 'حدث خطأ أثناء الحفظ' }); return }
    setMsg({ type: 'success', text: editId ? '✅ تم التعديل بنجاح' : '✅ تمت الإضافة بنجاح' })
    setShowForm(false)
    setEditId(null);
    (e.target as HTMLFormElement).reset()
    fetchNotes()
  }

  async function deleteNote(id: string) {
    if (!confirm('هل تريد حذف هذه الملاحظة؟')) return
    await supabase.from('student_notes').delete().eq('id', id)
    fetchNotes()
  }

  const categoryStyle: any = {
    health:     { bg: '#fdecea', color: 'var(--color-error)',   label: '🏥 صحي'       },
    allergy:    { bg: '#fff4e0', color: 'var(--color-warning)', label: '⚠️ حساسية'    },
    behavioral: { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)', label: '📋 سلوكي' },
    other:      { bg: 'var(--color-surface-offset)', color: 'var(--color-text-muted)', label: '📝 أخرى'  },
  }

  const card: any = { background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 700 }}>
      <Link href="/parent/dashboard" style={{ color: 'var(--color-primary)', fontWeight: 700,
        marginBottom: 'var(--space-4)', display: 'inline-block' }}>← رجوع</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
          ملاحظات {student?.full_name}
        </h2>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setMsg(null) }} style={{
          background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
          padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 700
        }}>{showForm ? '✕ إلغاء' : '+ إضافة ملاحظة'}</button>
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
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-5)' }}>
            {editId ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>التصنيف *</label>
                <select name="category" required style={{ border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)', padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <option value="health">🏥 صحي</option>
                  <option value="allergy">⚠️ حساسية</option>
                  <option value="behavioral">📋 سلوكي</option>
                  <option value="other">📝 أخرى</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>العنوان *</label>
                <input name="title" type="text" placeholder="مثال: حساسية من الفول السوداني" required
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                    padding: '.85rem 1rem', borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>التفاصيل *</label>
              <textarea name="content" rows={4} required
                placeholder="اكتب تفاصيل الملاحظة هنا... مثال: الطالب لديه حساسية شديدة من المكسرات، يرجى الانتباه عند وجبات الطعام"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  padding: '.85rem 1rem', borderRadius: 'var(--radius-md)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', fontWeight: 700 }}>إلغاء</button>
              <button type="submit" disabled={loading}
                style={{ background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)', padding: 'var(--space-3) var(--space-8)',
                  borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
                {loading ? 'جارٍ الحفظ...' : editId ? 'تعديل' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {notes.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: 'var(--space-16)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>📝</div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              لا توجد ملاحظات بعد
            </p>
            <p style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
              أضف ملاحظات مهمة كالحساسية أو الحالات الصحية
            </p>
          </div>
        )}
        {notes.map((n: any) => {
          const cs = categoryStyle[n.category] ?? categoryStyle.other
          return (
            <div key={n.id} style={{ ...card, borderRight: `4px solid ${cs.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: 'var(--space-3)' }}>
                <div>
                  <span style={{ background: cs.bg, color: cs.color, padding: '.25rem .7rem',
                    borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700,
                    display: 'inline-block', marginBottom: 'var(--space-2)' }}>{cs.label}</span>
                  <h3 style={{ fontWeight: 800, fontSize: 'var(--text-base)' }}>{n.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button onClick={() => { setEditId(n.id); setShowForm(true); setMsg(null) }}
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-primary)',
                      padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-primary)' }}>تعديل</button>
                  <button onClick={() => deleteNote(n.id)}
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-error)',
                      padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-error)' }}>حذف</button>
                </div>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)',
                lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.content}</p>
              <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)',
                color: 'var(--color-text-faint)' }}>
                {new Date(n.created_at).toLocaleDateString('ar-SA')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}