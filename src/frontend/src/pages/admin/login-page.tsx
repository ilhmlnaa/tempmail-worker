import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminMutation } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeSwitcher } from '@/components/theme-switcher'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const login = useAdminMutation<{ ok: true; redirect: string }, { password: string }>('/auth/login')
  const submit = (e: FormEvent) => { e.preventDefault(); login.mutate({ password }, { onSuccess: result => { toast.success('Logged in successfully'); location.href = result.redirect.replace('/legacy/admin', '/admin') }, onError: err => toast.error(err.message) }) }
  return <div className="login-shell">
    <div className="login-header"><ThemeSwitcher /></div>
    <form className="login-form" onSubmit={submit}>
      <div className="brand-lockup">
        <img src="/legacy/logo.png" alt="VoidMail" className="brand-logo login-logo" />
        <h2>Void<span>Mail</span> Admin</h2>
        <p>Sign in to the control center.</p>
      </div>
      <div className="form-stack">
        <label>
          <span>Administrator password</span>
          <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <Button type="submit" size="lg" disabled={login.isPending}>
          <LogIn className="mr-2 h-4 w-4" />
          {login.isPending ? 'Verifying…' : 'Sign in'}
        </Button>
      </div>
    </form>
  </div>
}
