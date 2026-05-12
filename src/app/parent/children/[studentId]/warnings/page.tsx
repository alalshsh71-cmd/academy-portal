import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ParentWarnings({ params }: { params: { studentId: string } }) {
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
    .from('students').select('full_name').eq('id', params.studentId).single()

  const { data: warnings } = await supabase
    .from('warnings').select('*').eq('student_id', params.studentId)
    .order('created_at', { ascending: false })

  const levelStyle: any = {
    info:     { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)', label: 'معلومة' },
    warning:  { bg: '#fff4e0',                        color: 'var(--color-warning)', label: 'تحذير'  },
    critical: { bg: '#fdecea',                        color: 'var(--color-error)',   label: 'حرج'    },
  }

  const card: any = { background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 700 }}>
      <Link href="/parent/dashboard" style={{ color: 'var(--color-primary)', fontWeight: 700,
        marginBottom: 'var(--space-4)', display: 'inline-block' }}>← رجوع</Link>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
        إنذارات {student?.full_name}
      </h2>
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {(!warnings || warnings.length === 0) && (
          <div style={{ ...card, textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>✅</div>
            <p style={{ color: 'var(--color-text-muted)' }}>لا توجد إنذارات</p>
          </div>
        )}
        {warnings?.map((w: any) => {
          const ls = levelStyle[w.level] ?? { bg: '', color: 'var(--color-text-muted)', label: w.level }
          return (
            <div key={w.id} style={{ ...card, opacity: w.is_resolved ? 0.6 : 1,
              borderRight: `4px solid ${ls.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ background: ls.bg, color: ls.color, padding: '.2rem .6rem',
                    borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 700,
                    marginBottom: 'var(--space-2)', display: 'inline-block' }}>{ls.label}</span>
                  <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-2)' }}>{w.title}</h3>
                  {w.description && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    {w.description}</p>}
                </div>
                {w.is_resolved && (
                  <span style={{ background: 'var(--color-primary-highlight)', color: 'var(--color-primary)',
                    padding: '.3rem .8rem', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)', fontWeight: 700, whiteSpace: 'nowrap' }}>مُحلول</span>
                )}
              </div>
              <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)',
                color: 'var(--color-text-faint)' }}>
                {new Date(w.created_at).toLocaleDateString('ar-SA')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}