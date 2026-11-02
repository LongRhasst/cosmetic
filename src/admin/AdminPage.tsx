import { useEffect, useState } from 'react'
import { adminApi, ApiStatusError, type AdminInfo } from '../api'
import Link from '../components/Link'
import Logo from '../components/Logo'
import { navigate } from '../router'
import ProductList from './ProductList'
import RequestList from './RequestList'

type Tab = 'requests' | 'products'

const TABS: Record<Tab, { label: string; description: string }> = {
  requests: { label: 'Đề xuất cập nhật', description: 'Duyệt hoặc từ chối thông tin người dùng đề xuất sửa.' },
  products: { label: 'Sản phẩm', description: 'Chọn sản phẩm cho phép đề xuất và xem thông tin đã duyệt sửa.' },
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('requests')

  useEffect(() => {
    const controller = new AbortController()
    adminApi
      .me(controller.signal)
      .then(setAdmin)
      .catch((e: Error) => {
        if (e.name === 'AbortError') return
        if (e instanceof ApiStatusError && e.status === 401) navigate('/admin/login', true)
        else setError(e.message)
      })
    return () => controller.abort()
  }, [])

  async function logout(everywhere: boolean) {
    await (everywhere ? adminApi.logoutAll() : adminApi.logout()).catch(() => {})
    navigate('/admin/login', true)
  }

  if (!admin) {
    return (
      <main className="container admin-loading">
        {error ? <p className="error">{error}</p> : <p className="muted">Đang tải…</p>}
      </main>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <Link href="/admin" className="brand" aria-label="Trang quản trị">
            <Logo />
            <span className="brand-text">
              <strong>Cosmetic</strong>
              <span>Quản trị</span>
            </span>
          </Link>
          <div className="admin-user">
            <Link href="/" className="admin-site-link">
              Xem trang công khai
            </Link>
            <span className="avatar" aria-hidden="true">
              {admin.username.slice(0, 1).toUpperCase()}
            </span>
            <span className="admin-username">{admin.username}</span>
            <button type="button" className="button" onClick={() => logout(false)}>
              Đăng xuất
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => logout(true)}
              title="Thu hồi mọi phiên đăng nhập của tài khoản này trên mọi thiết bị"
            >
              Đăng xuất mọi nơi
            </button>
          </div>
        </div>
      </header>

      <main className="container admin">
        <div className="admin-header">
          <div>
            <h1>{TABS[tab].label}</h1>
            <p className="muted">{TABS[tab].description}</p>
          </div>
          <nav className="segmented" aria-label="Mục quản trị">
            {(Object.keys(TABS) as Tab[]).map((key) => (
              <button
                key={key}
                type="button"
                className="segmented-item"
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {TABS[key].label}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'requests' ? <RequestList /> : <ProductList />}
      </main>
    </div>
  )
}
