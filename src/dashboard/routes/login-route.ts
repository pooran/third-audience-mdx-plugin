import { NextResponse, type NextRequest } from 'next/server'
import { verifyPassword, signSession, recordLogin, loadAdmin } from '../admin-store.js'

const COOKIE_NAME = 'ta_session'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

const LOGIN_HTML = (error?: string, reset?: boolean) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${reset ? 'Reset Password' : 'Third Audience — Login'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f7; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 40px 48px; width: 100%; max-width: 380px; }
    .logo { font-size: 22px; font-weight: 700; color: #1d1d1f; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #6e6e73; margin-bottom: 32px; }
    label { display: block; font-size: 13px; font-weight: 500; color: #1d1d1f; margin-bottom: 6px; }
    input[type=password] { width: 100%; padding: 10px 14px; border: 1.5px solid #d2d2d7; border-radius: 10px; font-size: 15px; outline: none; transition: border-color .15s; }
    input[type=password]:focus { border-color: #007aff; }
    .error { background: #fff2f2; border: 1px solid #ffbaba; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #c0392b; margin-bottom: 20px; }
    .btn { width: 100%; background: #007aff; color: #fff; border: none; border-radius: 10px; padding: 12px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: background .15s; }
    .btn:hover { background: #0062cc; }
    .hint { font-size: 12px; color: #6e6e73; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Third Audience</div>
    <div class="subtitle">${reset ? 'Choose a new password to continue' : 'Sign in to your dashboard'}</div>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="POST">
      ${reset ? `
      <div style="margin-bottom:16px">
        <label for="password">New password</label>
        <input id="password" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters">
      </div>
      <div>
        <label for="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autocomplete="new-password" required placeholder="Repeat password">
      </div>
      <input type="hidden" name="action" value="reset">
      <button class="btn" type="submit">Set password</button>
      ` : `
      <div>
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="Enter your password">
      </div>
      <button class="btn" type="submit">Sign in</button>
      `}
      <p class="hint">Third Audience Dashboard</p>
    </form>
  </div>
</body>
</html>`

export async function GET(req: NextRequest): Promise<NextResponse> {
  const reset = req.nextUrl.searchParams.get('reset') === '1'
  return new NextResponse(LOGIN_HTML(undefined, reset), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.formData()
  const action = body.get('action') as string | null
  const password = body.get('password') as string | null
  const confirm = body.get('confirm') as string | null

  if (action === 'reset') {
    if (!password || password.length < 8) {
      return new NextResponse(LOGIN_HTML('Password must be at least 8 characters.', true), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    if (password !== confirm) {
      return new NextResponse(LOGIN_HTML('Passwords do not match.', true), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    const { updatePassword } = await import('../admin-store.js')
    updatePassword(password)
    // Issue new session after reset
    const token = signSession('admin:' + Date.now())
    const res = NextResponse.redirect(new URL('/third-audience/', req.nextUrl))
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return res
  }

  // Normal login
  if (!password || !verifyPassword(password)) {
    return new NextResponse(LOGIN_HTML('Incorrect password.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  recordLogin()

  const admin = loadAdmin()
  const token = signSession('admin:' + Date.now())

  // If this was the default password, force reset before entering dashboard
  if (admin?.isDefaultPassword) {
    const res = NextResponse.redirect(new URL('/third-audience/login?reset=1', req.nextUrl))
    // Set a temporary cookie so reset page knows we're authenticated
    res.cookies.set(COOKIE_NAME + '_reset', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300, // 5 min to complete reset
      path: '/third-audience/login',
    })
    return res
  }

  const res = NextResponse.redirect(new URL('/third-audience/', req.nextUrl))
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
