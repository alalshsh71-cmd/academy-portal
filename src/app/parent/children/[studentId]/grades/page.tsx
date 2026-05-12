import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ParentGrades({ params }: { params: { studentId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: parent } = await supabase
    .from('parents').select('id').eq('profile_id', user.id).single()

  // تحقق أن الطالب تابع لهذا ولي الأمر
  const { data: link } = await supabase
    .from('parent_students')
    .select('id').eq('parent_id', parent?.id).eq('student_id', params.studentId).single()
  if (!link) redirect('/parent/dashboard')

  const { data: student } = await supabase
    .from('students').select('full_name, student_number').eq('id', params.studentId).single()

  const { data: grades } = await supabase
    .from('grades').select('*').eq('student_id', params.studentId)
    .order('exam_date', { ascending: false })

  const card: any = { background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }

  function gradeColor(score: number, max: number) {
    const p = (score / max) * 100
    if (p >= 90) return 'var(--color-success)'
    if (p >= 75) return 'var(--color-primary)'
    if (p >= 60) return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 800 }}>
      <Link href="/parent/dashboard" style={{ color: 'var(--color-primary)', fontWeight: 700,
        marginBottom: 'var(--space-4)', display: 'inline-block' }}>← رجوع</Link>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
        درجات {student?.full_name}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
        رقم: {student?.student_number}
      </p>
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-divider)' }}>
              {['المادة','الاختبار','الدرجة','التاريخ'].map(h => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!grades || grades.length === 0) && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-12)',
                color: 'var(--color-text-muted)' }}>لا توجد درجات بعد</td></tr>
            )}
            {grades?.map((g: any) => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>{g.subject}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)' }}>{g.exam_name}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontWeight: 800, color: gradeColor(g.score, g.max_score),
                    fontVariantNumeric: 'tabular-nums' }}>{g.score}</span>
                  <span style={{ color: 'var(--color-text-faint)' }}>/{g.max_score}</span>
                  <span style={{ marginRight: 'var(--space-2)', fontSize: 'var(--text-xs)',
                    color: gradeColor(g.score, g.max_score) }}>
                    ({Math.round((g.score / g.max_score) * 100)}%)
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)' }}>{g.exam_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}