import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ParentAttendance({ params }: { params: { studentId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: parent } = await supabase
    .from('parents').select('id').eq('profile_id', user.id).single()

  const { data: link } = await supabase
    .from('parent_students')
    .select('id').eq('parent_id', parent?.id).eq('student_id', params.studentId).single()
  if (!link) redirect('/parent/dashboard')

  const { data: student } = await supabase
    .from('students').select('full_name, student_number').eq('id', params.studentId).single()

  const { data: records } = await supabase
    .from('attendance').select('*').eq('student_id', params.studentId)
    .order('date', { ascending: false })

  const present = records?.filter(r => r.status === 'present').length ?? 0
  const absent  = records?.filter(r => r.status === 'absent').length ?? 0
  const late    = records?.filter(r => r.status === 'late').length ?? 0
  const total   = records?.length ?? 0

  const statusStyle: any = {
    present: { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)', label: 'حاضر'  },
    absent:  { bg: '#fdecea',                        color: 'var(--color-error)',   label: 'غائب'   },
    late:    { bg: '#fff4e0',                        color: 'var(--color-warning)', label: 'متأخر'  },
    excused: { bg: 'var(--color-surface-offset)',    color: 'var(--color-text-muted)', label: 'إجازة' },
  }

  const card: any = { background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 800 }}>
      <Link href="/parent/dashboard" style={{ color: 'var(--color-primary)', fontWeight: 700,
        marginBottom: 'var(--space-4)', display: 'inline-block' }}>← رجوع</Link>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
        حضور {student?.full_name}
      </h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'إجمالي', value: total,   color: 'var(--color-text)'    },
          { label: 'حاضر',   value: present, color: 'var(--color-success)' },
          { label: 'غائب',   value: absent,  color: 'var(--color-error)'   },
          { label: 'متأخر',  value: late,    color: 'var(--color-warning)'  },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color,
              fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-divider)' }}>
              {['التاريخ','الحالة','ملاحظات'].map(h => (
                <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!records || records.length === 0) && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 'var(--space-12)',
                color: 'var(--color-text-muted)' }}>لا توجد سجلات بعد</td></tr>
            )}
            {records?.map((r: any) => {
              const ss = statusStyle[r.status] ?? { bg: '', color: 'var(--color-text-muted)', label: r.status }
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>{r.date}</td>
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
  )
}