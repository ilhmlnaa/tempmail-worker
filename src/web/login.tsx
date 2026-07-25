import { html } from 'hono/html'
import { Layout } from './layout'

export function LoginPage({ error }: { error?: string }) {
  return Layout({
    title: 'Admin Login',
    children: html`
    <div class="auth-card">
      <h1 style="display:flex;align-items:center;justify-content:center;gap:12px;">
        <i data-lucide="shield-zap" style="width:32px;height:32px;color:var(--primary)"></i> 
        <span>Void<span style="color:var(--primary)">Mail</span></span>
      </h1>
      <p>Enter your admin password to access the portal</p>
      <form method="post" action="/auth/login" id="loginForm">
        <input type="password" name="password" class="auth-input" placeholder="Admin password" required autofocus />
        <button type="submit" class="auth-btn">Sign In to Admin Portal</button>
        ${error ? html`<p class="auth-error">${error}</p>` : ''}
      </form>
    </div>
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const pwd = e.target.password.value
        const res = await fetch('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pwd}) })
        if(res.ok) { window.location = '/admin' }
        else { document.querySelector('.auth-error')?.remove(); const p=document.createElement('p');p.className='auth-error';p.textContent='Invalid password';e.target.appendChild(p) }
      })
    </script>
  `
  })
}

export function SetupPage({ error }: { error?: string }) {
  return Layout({
    title: 'First Run Setup',
    children: html`
    <div class="auth-card">
      <h1 style="display:flex;align-items:center;justify-content:center;gap:12px;">
        <i data-lucide="shield-check" style="width:32px;height:32px;color:var(--primary)"></i> First Run Setup
      </h1>
      <p>Set a strong admin password to secure your VoidMail portal.</p>
      <form method="post" action="/setup">
        <input type="password" name="password" class="auth-input" placeholder="New Password (min 8 chars)" required minlength="8" autofocus />
        <input type="password" name="confirm" class="auth-input" placeholder="Confirm Password" required minlength="8" />
        <button type="submit" class="auth-btn">Save & Continue</button>
        ${error ? html`<p class="auth-error">${error}</p>` : ''}
      </form>
    </div>
  `
  })
}
