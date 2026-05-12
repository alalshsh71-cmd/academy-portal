import { login } from '@/lib/auth/actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMsg = searchParams?.error

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center',
      background: 'var(--color-bg)', padding: 'var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          marginBottom: 'var(--space-8)' }}>
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none"
            style={{ color: 'var(--color-primary)' }}>
            <rect x="8" y="10" width="48" height="44" rx="14"
              stroke="currentColor" strokeWidth="4"/>
            <path d="M18 25L32 18L46 25L32 32L18 25Z"
              stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M24 31V39C24 42 28 45 32 45C36 45 40 42 40 39V31"
              stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>بوابة الأكاديمية</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              تسجيل الدخول لمتابعة أبنائك
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-md)' }}>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: '#fdecea', color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)', fontWeight: 700,
              fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
            }}>
              ⚠️ {decodeURIComponent(errorMsg)}
            </div>
          )}

          <form action={login} style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label htmlFor="username"
                style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                اسم المستخدم
              </label>
              <input id="username" name="username" type="text"
                placeholder="رقم الجوال أو اسم المستخدم"
                autoComplete="username" required
                style={{ border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  padding: '.95rem 1rem', borderRadius: 'var(--radius-md)',
                  width: '100%' }}/>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <label htmlFor="password"
                style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                كلمة المرور
              </label>
              <input id="password" name="password" type="password"
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password" required
                style={{ border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  padding: '.95rem 1rem', borderRadius: 'var(--radius-md)',
                  width: '100%' }}/>
            </div>

            <button type="submit"
              style={{ background: 'var(--color-primary)',
                color: 'var(--color-text-inverse)', padding: '1rem',
                borderRadius: 'var(--radius-md)', fontWeight: 700,
                fontSize: 'var(--text-base)', cursor: 'pointer',
                width: '100%' }}>
              تسجيل الدخول
            </button>
          </form>

          <p style={{ marginTop: 'var(--space-5)', fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)', textAlign: 'center' }}>
            حسابك يُنشئه فريق الإدارة فقط
          </p>
        </div>
      </div>
    </div>
  )
}