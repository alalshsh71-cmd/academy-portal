import { changePassword } from '@/lib/auth/actions'

export default function ChangePasswordPage() {
  return (
    <div style={{minHeight:'100dvh',display:'grid',placeItems:'center',
      background:'var(--color-bg)',padding:'var(--space-4)'}}>
      <div style={{width:'100%',maxWidth:'420px',background:'var(--color-surface)',
        border:'1px solid var(--color-border)',borderRadius:'var(--radius-xl)',
        padding:'var(--space-8)',boxShadow:'var(--shadow-md)'}}>
        <h2 style={{fontSize:'var(--text-lg)',fontWeight:800,
          marginBottom:'var(--space-2)'}}>تغيير كلمة المرور</h2>
        <p style={{color:'var(--color-text-muted)',marginBottom:'var(--space-6)',
          fontSize:'var(--text-sm)'}}>
          يُرجى تغيير كلمة المرور المؤقتة قبل المتابعة
        </p>
        <form action={changePassword} style={{display:'grid',gap:'var(--space-5)'}}>
          {[
            {name:'current_password', label:'كلمة المرور الحالية'},
            {name:'new_password',     label:'كلمة المرور الجديدة'},
            {name:'confirm_password', label:'تأكيد كلمة المرور'},
          ].map(f => (
            <div key={f.name} style={{display:'grid',gap:'var(--space-2)'}}>
              <label htmlFor={f.name}
                style={{fontWeight:700,fontSize:'var(--text-sm)'}}>
                {f.label}
              </label>
              <input id={f.name} name={f.name} type="password" required
                style={{border:'1px solid var(--color-border)',
                  background:'var(--color-surface-2)',
                  padding:'.95rem 1rem',borderRadius:'var(--radius-md)'}}/>
            </div>
          ))}
          <button type="submit"
            style={{background:'var(--color-primary)',
              color:'var(--color-text-inverse)',padding:'1rem',
              borderRadius:'var(--radius-md)',fontWeight:700}}>
            حفظ كلمة المرور
          </button>
        </form>
      </div>
    </div>
  )
}