import Link from './Link'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <strong>Cosmetic</strong>
          <p className="muted">
            So sánh mỹ phẩm từ dữ liệu thu thập trên các sàn. Giá và tồn kho có thể thay đổi, vui lòng kiểm tra lại trên
            trang bán trước khi mua.
          </p>
        </div>
        <nav aria-label="Liên kết cuối trang">
          <Link href="/">Trang chủ</Link>
          <Link href="/compare">So sánh</Link>
        </nav>
      </div>
    </footer>
  )
}
