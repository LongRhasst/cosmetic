import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '../api'
import Logo from '../components/Logo'
import { navigate } from '../router'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Đã đăng nhập thì vào thẳng trang quản trị
    const controller = new AbortController()
    adminApi
      .me(controller.signal)
      .then(() => navigate('/admin', true))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminApi.login(username, password)
      navigate('/admin', true)
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <main className="container login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-head">
          <Logo />
          <h1>Quản trị</h1>
          <p className="muted">Đăng nhập để duyệt đề xuất và quản lý sản phẩm.</p>
        </div>
        <label className="form-label">
          Tên đăng nhập
          <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>
        <label className="form-label">
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button primary login-submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  )
}
