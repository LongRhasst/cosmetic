import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AdminLogin from './admin/AdminLogin.tsx'
import AdminPage from './admin/AdminPage.tsx'
import Link from './components/Link.tsx'
import SiteFooter from './components/SiteFooter.tsx'
import SiteHeader from './components/SiteHeader.tsx'
import ComparePage from './pages/ComparePage.tsx'
import HomePage from './pages/HomePage.tsx'
import { usePathname } from './router.ts'

function NotFound() {
  return (
    <main className="container">
      <h1>Không tìm thấy trang</h1>
      <p className="muted">
        <Link href="/">Về trang chủ</Link>
      </p>
    </main>
  )
}

function Root() {
  const pathname = usePathname().replace(/\/+$/, '') || '/'
  // Trang quản trị không có header công khai; vào bằng URL /admin/login
  if (pathname === '/admin/login') return <AdminLogin />
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <AdminPage />

  // key: đổi trang thì tạo lại trang mới (đọc lại tham số URL)
  const page =
    pathname === '/' ? <HomePage key="home" /> : pathname === '/compare' ? <ComparePage key={window.location.search} /> : <NotFound />
  return (
    <>
      <SiteHeader pathname={pathname} />
      {page}
      <SiteFooter />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
