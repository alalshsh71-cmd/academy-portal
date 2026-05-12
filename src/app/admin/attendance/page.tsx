'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const supabase = createClient()

  async function fetchData() {
    const { data } = await supabase
      .from('attendance')
      .select('*, students(full_name)')
      .eq('date', date)
      .order('created_at', { ascending: false })
    setRecords(data ?? [])
  }

  useEffect(() => { fetchData() }, [date])

  const statusStyle = (s: string) => ({
    present: { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)',   label: 'حاضر'  },
    absent:  { bg: '#fdecea',                        color: 'var(--color-error)',     label: 'غائب'  },
    late:    { bg: '#fff4e0',                        color: 'var(--color-warning)',   label: 'متأخر' },
    excused: { bg: 'var(--color-surface-offset)',    color: 'var(--color-text-muted)',label: 'إجازة' },
  }[s] ?? { bg: 'var(--color-surface-offset)', color: 'var(--color-text-muted)', label: s })

  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)'
  }

  const present = records.filter(r => r.status === 'present').length
  const absent  = records.filter(r => r.status === 'absent').length
  const late    = records.filter(r => r.status === 'late').length

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>الحضور والغياب</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', fontWeight: 600 }} />
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {[
            { label: 'حاضر',  value: present, color: 'var(--color-success)' },
            { label: 'غائب',  value: absent,  color: 'var(--color-error)'   },
            { label: 'متأخر', value: late,    color: 'var(--color-warning)'  },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-divider)' }}>
                {['الطالب','التاريخ','الحالة','ملاحظات'].map(h => (
                  <th key={h} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-12)',
                  color: 'var(--color-text-muted)' }}>لا يوجد سجلات لهذا اليوم</td></tr>
              )}
              {records.map((r: any) => {
                const ss = statusStyle(r.status)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                      {r.students?.full_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)' }}>{r.date}</td>
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
    </div>
  )
}