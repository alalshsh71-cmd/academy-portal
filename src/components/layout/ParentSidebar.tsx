'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'الرئيسية',       href: '/parent/dashboard', icon: '🏠' },
  { label: 'الملف الشخصي',  href: '/parent/profile',   icon: '👤' },
]

export default function ParentSidebar({ fullName }: { fullName: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/parent/dashboard' ? pathname === href : pathname.startsWith(href)

  /* ── Sidebar content (shared between desktop & mobile drawer) ── */
  function SidebarContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-5)' }}>

        {/* Logo */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>أ</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 'var(--text-base)' }}>بوابة الأكاديمية</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ولي الأمر</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-1)' }}>مرحباً</div>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>{fullName}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
                fontWeight: isActive(item.href) ? 800 : 500,
                background: isActive(item.href) ? 'var(--color-primary-highlight)' : 'transparent',
                color: isActive(item.href) ? 'var(--color-primary)' : 'var(--color-text)',
                textDecoration: 'none', fontSize: 'var(--text-sm)',
                transition: 'background var(--transition-interactive)'
              }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
            fontWeight: 700, color: 'var(--color-error)', fontSize: 'var(--text-sm)',
            width: '100%', textAlign: 'right', marginTop: 'var(--space-4)',
            border: '1px solid var(--color-error)', background: 'transparent',
            cursor: 'pointer' }}>
          <span>🚪</span> تسجيل الخروج
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{ width: 240, minWidth: 240, background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)', height: '100dvh', position: 'sticky',
        top: 0, overflowY: 'auto', display: 'none' }}
        className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="sidebar-mobile-bar" style={{ display: 'none', position: 'fixed', top: 0,
        right: 0, left: 0, zIndex: 50, background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)', padding: 'var(--space-3) var(--space-4)',
        alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 900 }}>بوابة الأكاديمية</div>
        <button onClick={() => setOpen(true)}
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            fontSize: 20, cursor: 'pointer' }}>☰</button>
      </div>

      {/* Mobile top padding */}
      <div className="sidebar-mobile-pad" style={{ display: 'none', height: 60 }} />

      {/* Mobile Drawer */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.4)' }} />
          <aside style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 280,
            background: 'var(--color-surface)', overflowY: 'auto', zIndex: 101 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-4)' }}>
              <button onClick={() => setOpen(false)}
                style={{ fontSize: 20, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  cursor: 'pointer' }}>✕</button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop     { display: block !important; }
          .sidebar-mobile-bar  { display: none  !important; }
          .sidebar-mobile-pad  { display: none  !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop     { display: none  !important; }
          .sidebar-mobile-bar  { display: flex  !important; }
          .sidebar-mobile-pad  { display: block !important; }
        }
      `}</style>
    </>
  )
}