import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = createClient()
  const in7days = new Date(Date.now() + 7*86400000).toISOString().split('T')[0]

  const [
    { count: totalParents },
    { count: totalStudents },
    { count: expiring },
    { count: openWarnings }
  ] = await Promise.all([
    supabase.from('parents').select('*',{count:'exact',head:true}),
    supabase.from('students').select('*',{count:'exact',head:true}).eq('is_active',true),
    supabase.from('subscriptions').select('*',{count:'exact',head:true})
      .eq('status','active').lte('end_date', in7days),
    supabase.from('warnings').select('*',{count:'exact',head:true}).eq('is_resolved',false),
  ])

  const { data: expiringList } = await supabase
    .from('subscription_status_view').select('*')
    .lte('end_date', in7days).order('end_date').limit(5)

  const { data: warnList } = await supabase
    .from('warnings').select('*, students(full_name)')
    .eq('is_resolved',false).order('created_at',{ascending:false}).limit(5)

  const stats = [
    { label:'أولياء الأمور',              value: totalParents ?? 0,  color:'var(--color-success)' },
    { label:'الطلاب النشطين',             value: totalStudents ?? 0, color:'var(--color-primary)' },
    { label:'اشتراكات تنتهي هذا الأسبوع', value: expiring ?? 0,      color:'var(--color-warning)' },
    { label:'إنذارات مفتوحة',             value: openWarnings ?? 0,  color:'var(--color-error)'   },
  ]

  return (
    <div style={{padding:'var(--space-6)'}}>
      <h2 style={{fontSize:'var(--text-xl)',fontWeight:800,marginBottom:'var(--space-6)'}}>
        لوحة التحكم
      </h2>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
        gap:'var(--space-5)',marginBottom:'var(--space-8)'}}>
        {stats.map(s => (
          <div key={s.label} style={{background:'var(--color-surface)',
            border:'1px solid var(--color-border)',borderRadius:'var(--radius-xl)',
            padding:'var(--space-5)',boxShadow:'var(--shadow-sm)'}}>
            <div style={{fontSize:'var(--text-sm)',color:'var(--color-text-muted)',
              marginBottom:'var(--space-2)'}}>{s.label}</div>
            <div style={{fontSize:'var(--text-xl)',fontWeight:800,color:s.color}}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-6)'}}>
        {/* Expiring */}
        <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',
          borderRadius:'var(--radius-xl)',padding:'var(--space-5)'}}>
          <h3 style={{fontWeight:800,marginBottom:'var(--space-4)'}}>
            اشتراكات تنتهي قريبًا
          </h3>
          {expiringList?.length === 0 &&
            <p style={{color:'var(--color-text-muted)'}}>لا يوجد</p>}
          <div style={{display:'grid',gap:'var(--space-3)'}}>
            {expiringList?.map((s: any) => (
              <div key={s.id} style={{display:'flex',justifyContent:'space-between',
                padding:'var(--space-3)',border:'1px solid var(--color-divider)',
                borderRadius:'var(--radius-lg)',background:'var(--color-surface-2)'}}>
                <div>
                  <strong>{s.student_name}</strong>
                  <div style={{fontSize:'var(--text-sm)',color:'var(--color-text-muted)'}}>
                    ينتهي: {s.end_date}
                  </div>
                </div>
                <span style={{background:'color-mix(in srgb,var(--color-warning) 14%,var(--color-surface))',
                  color:'var(--color-warning)',padding:'.4rem .7rem',
                  borderRadius:'var(--radius-full)',fontSize:'var(--text-sm)',
                  fontWeight:700,whiteSpace:'nowrap'}}>
                  {s.days_remaining} يوم
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',
          borderRadius:'var(--radius-xl)',padding:'var(--space-5)'}}>
          <h3 style={{fontWeight:800,marginBottom:'var(--space-4)'}}>إنذارات مفتوحة</h3>
          {warnList?.length === 0 &&
            <p style={{color:'var(--color-text-muted)'}}>لا توجد إنذارات</p>}
          <div style={{display:'grid',gap:'var(--space-3)'}}>
            {warnList?.map((w: any) => (
              <div key={w.id} style={{display:'flex',justifyContent:'space-between',
                padding:'var(--space-3)',border:'1px solid var(--color-divider)',
                borderRadius:'var(--radius-lg)',background:'var(--color-surface-2)'}}>
                <div>
                  <strong>{w.students?.full_name}</strong>
                  <div style={{fontSize:'var(--text-sm)',color:'var(--color-text-muted)'}}>
                    {w.title}
                  </div>
                </div>
                <span style={{
                  background:`color-mix(in srgb,var(--color-${w.level==='critical'?'error':'warning'}) 14%,var(--color-surface))`,
                  color:`var(--color-${w.level==='critical'?'error':'warning'})`,
                  padding:'.4rem .7rem',borderRadius:'var(--radius-full)',
                  fontSize:'var(--text-sm)',fontWeight:700}}>
                  {w.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}