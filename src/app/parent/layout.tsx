import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParentSidebar from '@/components/layout/ParentSidebar'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single()

  if (profile?.role !== 'parent') redirect('/admin/dashboard')

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <ParentSidebar fullName={profile.full_name} />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}