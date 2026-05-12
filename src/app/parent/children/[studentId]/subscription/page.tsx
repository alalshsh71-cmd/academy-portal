import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ParentSubscription({ params }: { params: { studentId: string } }) {
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

  const { data: subs } = await supabase
    .from('subscriptions').select('*').eq('student_id', params.studentId)
    .order('start_date', { ascending: false })

  const card: any = { background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 700 }}>
      <Link href="/parent/dashboard" style={{ color: 'var(--color-primary)', fontWeight: 700,
        marginBottom: 'var(--space-4)', display: 'inline-block' }}>← رجوع</Link>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
        اشتراكات {student?.full_name}
      </h2>

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {(!subs || subs.length === 0) && (
          <div style={{ ...card, textAlign: 'center', padding: 'var(--space-12)',
            color: 'var(--color-text-muted)' }}>لا توجد اشتراكات</div>
        )}
        {subs?.map((s: any) => {
          const daysLeft = Math.ceil((new Date(s.end_date).getTime() - Date.now()) / 86400000)
          const isActive = s.status === 'active'
          return (
            <div key={s.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>{s.plan_name}</h3>
                <span style={{
                  background: isActive ? 'var(--color-primary-highlight)' : '#fdecea',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-error)',
                  padding: '.3rem .8rem', borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)', fontWeight: 700
                }}>{isActive ? 'نشط' : 'منتهي'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                {[
                  { label: 'تاريخ البدء',    value: s.start_date },
                  { label: 'تاريخ الانتهاء', value: s.end_date   },
                  { label: 'الأيام المتبقية', value: isActive ? `${daysLeft} يوم` : '—',
                    color: isActive && daysLeft <= 14 ? 'var(--color-warning)' : isActive ? 'var(--color-success)' : 'var(--color-text-muted)' },
                ].map(i => (
                  <div key={i.label} style={{ background: 'var(--color-surface-offset)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                      marginBottom: 4 }}>{i.label}</div>
                    <div style={{ fontWeight: 800, color: i.color ?? 'var(--color-text)',
                      fontVariantNumeric: 'tabular-nums' }}>{i.value}</div>
                  </div>
                ))}
              </div>
              {s.amount && (
                <div style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)' }}>
                  المبلغ: <strong style={{ color: 'var(--color-text)' }}>{s.amount} ر.س</strong>
                </div>
              )}
              {s.notes && (
                <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)' }}>ملاحظات: {s.notes}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}