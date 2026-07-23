import { Layout } from './layout'

export function LoginPage({ error }: { error?: string }) {
  return Layout({
    title: 'Login',
    children: `
    <div class="auth-card">
      <h1>⚡ TempMail</h1>
      <p>Enter your dashboard password to continue</p>
      <form method="post" action="/auth/login" id="loginForm">
        <input type="password" name="password" class="auth-input" placeholder="Dashboard password" required autofocus />
        <button type="submit" class="auth-btn">Sign In</button>
        ${error ? `<p class="auth-error">${error}</p>` : ''}
      </form>
    </div>
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const pwd = e.target.password.value
        const res = await fetch('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pwd}) })
        if(res.ok) { window.location = '/' }
        else { document.querySelector('.auth-error')?.remove(); const p=document.createElement('p');p.className='auth-error';p.textContent='Invalid password';e.target.appendChild(p) }
      })
    </script>
  `
  })
}
