import Link from './Link'
import Logo from './Logo'

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/compare', label: 'So sánh' },
]

export default function SiteHeader({ pathname }: { pathname: string }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Cosmetic – về trang chủ">
          <Logo />
          <span className="brand-text">
            <strong>Cosmetic</strong>
            <span>So sánh mỹ phẩm</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
