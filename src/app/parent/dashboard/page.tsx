import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: parent } = await supabase
    .from('parents')
    .select('id, profiles(full_name)')
    .eq('profile_id', user.id)
    .single()

  const { data: children } = await supabase
    .from('parent_students')
    .select(`
      students (
        id, full_name, student_number, grade, group_name,
        grades (score, max_score, subject, exam_name, exam_date),
        warnings (title, level, is_resolved, created_at)
      )
    `)
    .eq('parent_id', parent?.id)

  const students = children?.map((c: any) => c.students) ?? []

  const studentIds = students.map((s: any) => s?.id).filter(Boolean)
  const { data: subsData } = studentIds.length > 0
    ? await supabase
        .from('subscription_status_view')
        .select('*')
        .in('student_id', studentIds)
    : { data: [] }

  const card: any = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)',
    textDecoration: 'none', color: 'inherit', display: 'block'
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 900 }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
          مرحباً، {(parent?.profiles as any)?.full_name} 👋
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>لديك {students.length} طالب مسجّل</p>
      </div>

      {students.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 'var(--space-16)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-4)' }}>👤</div>
          <p style={{ color: 'var(--color-text-muted)' }}>لا يوجد طلاب مرتبطون بحسابك بعد</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        {students.map((s: any) => {
          const activeSub = subsData?.find(
            (x: any) => x.student_id === s.id && x.computed_status !== 'expired'
          )
          const daysLeft: number | null = activeSub ? Number(activeSub.days_remaining) : null

          const openWarnings = s.warnings?.filter((w: any) => !w.is_resolved).length ?? 0
          const recentGrade = s.grades?.sort((a: any, b: any) =>
            new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0]

          const daysColor = daysLeft === null
            ? 'var(--color-text-muted)'
            : daysLeft <= 7  ? 'var(--color-error)'
            : daysLeft <= 14 ? 'var(--color-warning)'
            : 'var(--color-success)'

          return (
            <div key={s.id} style={card}>

              {/* Student Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-5)',
                borderBottom: '1px solid var(--color-divider)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>{s.full_name}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      رقم: <strong>{s.student_number}</strong>
                    </span>
                    {s.grade && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        الصف: <strong>{s.grade}</strong>
                      </span>
                    )}
                    {s.group_name && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        المجموعة: <strong>{s.group_name}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>

                {/* الاشتراك */}
                <div style={{ background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                    fontWeight: 700, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    الاشتراك
                  </div>
                  {activeSub ? (
                    <>
                      <div style={{ fontWeight: 800, color: daysColor, fontSize: 'var(--text-lg)', fontVariantNumeric: 'tabular-nums' }}>
                        {daysLeft} يوم
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {activeSub.plan_name} — ينتهي {activeSub.end_date}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--color-error)', fontWeight: 700 }}>لا يوجد اشتراك</div>
                  )}
                </div>

                {/* آخر درجة */}
                <div style={{ background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                    fontWeight: 700, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    آخر درجة
                  </div>
                  {recentGrade ? (
                    <>
                      <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', fontVariantNumeric: 'tabular-nums',
                        color: (recentGrade.score / recentGrade.max_score) >= 0.9
                          ? 'var(--color-success)' : (recentGrade.score / recentGrade.max_score) >= 0.6
                          ? 'var(--color-primary)' : 'var(--color-error)' }}>
                        {recentGrade.score}/{recentGrade.max_score}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {recentGrade.subject} — {recentGrade.exam_name}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--color-text-muted)' }}>—</div>
                  )}
                </div>

                {/* الإنذارات */}
                <div style={{ background: openWarnings > 0 ? '#fdecea' : 'var(--color-surface-offset)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                    fontWeight: 700, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    إنذارات مفتوحة
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', fontVariantNumeric: 'tabular-nums',
                    color: openWarnings > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                    {openWarnings}
                  </div>
                </div>

              </div>

              {/* Links */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)',
                paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-divider)', flexWrap: 'wrap' }}>
                {[
                  { label: 'الدرجات',      href: `/parent/children/${s.id}/grades`       },
                  { label: 'الاشتراك',     href: `/parent/children/${s.id}/subscription` },
                  { label: 'الإنذارات',    href: `/parent/children/${s.id}/warnings`     },
                  { label: 'ملاحظات خاصة', href: `/parent/children/${s.id}/notes`        },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-primary)',
                    padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-primary-highlight)',
                    background: 'var(--color-primary-highlight)'
                  }}>{l.label}</Link>
                ))}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}