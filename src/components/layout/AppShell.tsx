import Sidebar from './Sidebar'
import type { UserRole } from '@/types/database'

export default function AppShell({
  children, role, userName
}: {
  children: React.ReactNode
  role: UserRole
  userName: string
}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'280px 1fr',minHeight:'100dvh'}}>
      <Sidebar role={role} userName={userName} />
      <main style={{minWidth:0,overflowX:'hidden'}}>
        {children}
      </main>
    </div>
  )
}