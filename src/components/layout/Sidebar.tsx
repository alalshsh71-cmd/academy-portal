'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth/actions'
import type { UserRole } from '@/types/database'

const adminNav = [
  { href: '/admin/dashboard',     label: 'لوحة التحكم',      icon: '⌂'   },
  { href: '/admin/parents',       label: 'أولياء الأمور',    icon: '👨‍👩‍👧' },
  { href: '/admin/students',      label: 'الطلاب',           icon: '👨‍🎓' },
  { href: '/admin/subscriptions', label: 'الاشتراكات',       icon: '📅'  },
  { href: '/admin/grades',        label: 'الدرجات',          icon: '📘'  },
  { href: '/admin/warnings',      label: 'الإنذارات',        icon: '⚠️'  },
]

const parentNav = [
  { href: '/parent/dashboard',     label: 'الرئيسية',         icon: '⌂'   },
  { href: '/parent/children',      label: 'أبنائي',           icon: '👨‍🎓' },
  { href: '/parent/subscriptions', label: 'الاشتراكات',       icon: '📅'  },
  { href: '/parent/grades',        label: 'الدرجات',          icon: '📘'  },
  { href: '/parent/attendance',    label: 'الحضور والغياب',   icon: '🕘'  },
  { href: '/parent/warnings',      label: 'الإنذارات',        icon: '⚠️'  },
  { href: '/parent/notes',         label: 'الملاحظات الخاصة', icon: '🩺'  },
  { href: '/parent/profile',       label: 'الملف الشخصي',     icon: '👤'  },
]

export default function Sidebar({ role, userName }: { role: UserRole; userName: string }) {
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : parentNav

  return (
    <aside style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
      padding: 'var(--space-6)', position: 'sticky', top: 0, height: '100dvh',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', overflowY: 'auto' }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none"
          style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
          <rect x="8" y="10" width="48" height="44" rx="14"
            stroke="currentColor" strokeWidth="4"/>
          <path d="M18 25L32 18L46 25L32 32L18 25Z"
            stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
          <path d="M24 31V39C24 42 28 45 32 45C36 45 40 42 40 39V31"
            stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        </svg>
        <div>
          <h1 style={{ fontSize: 'var(--text-lg)', lineHeight: 1.1, fontWeight: 800 }}>
            بوابة الأكاديمية
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {role === 'admin' ? 'الإدارة' : 'ولي الأمر'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'grid', gap: 'var(--space-1)' }}>
        {nav.map(item => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
            color: pathname === item.href ? 'var(--color-primary)' : 'var(--color-text-muted)',
            background: pathname === item.href ? 'var(--color-primary-highlight)' : 'transparent',
            fontWeight: pathname === item.href ? 700 : 400,
            transition: 'all var(--transition)', textDecoration: 'none' }}>
            <span>{item.label}</span><span>{item.icon}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', display: 'grid', gap: 'var(--space-3)' }}>
        <div style={{ background: 'var(--color-surface-offset)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            مسجل الدخول كـ
          </div>
          <strong style={{ fontSize: 'var(--text-sm)' }}>{userName}</strong>
        </div>
        <form action={logout}>
          <button type="submit" style={{ width: '100%', padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
            background: 'var(--color-surface)', fontWeight: 700 }}>
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  )
}