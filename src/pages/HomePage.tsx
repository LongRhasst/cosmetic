import { useEffect, useState, type ReactNode } from 'react'
import {
  getStats,
  listBrands,
  listFeaturedCategories,
  listSources,
  searchProducts,
  type FilterOption,
  type ProductSummary,
  type Stats,
} from '../api'
import ComparePreview from '../components/ComparePreview'
import Link from '../components/Link'
import ProductPicker from '../components/ProductPicker'
import { formatNumber, formatPrice } from '../format'
import { navigate } from '../router'

const TOP_PRODUCTS = 8
const TOP_BRANDS = 18
const QUICK_CATEGORIES = 5

function compareUrl(params: Record<string, number>) {
  return `/compare?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
}

// Icon nét mảnh 24x24, dùng currentColor
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="feature-icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const FEATURES = [
  {
    title: 'Đối chiếu bảng thành phần',
    text: 'Từng chất INCI chung / riêng, kèm thứ tự hàm lượng; nhận ra Water = Aqua là cùng một chất.',
    large: true,
    icon: (
      <Icon>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 14h9" />
      </Icon>
    ),
  },
  {
    title: 'Giá theo ml / g',
    text: 'Quy đổi về cùng đơn vị để biết chai lớn có thật sự rẻ hơn chai nhỏ.',
    icon: (
      <Icon>
        <path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7zM8 21h8" />
      </Icon>
    ),
  },
  {
    title: 'Cùng sản phẩm, khác sàn',
    text: 'Ghép theo mã vạch để so giá một sản phẩm ở nhiều nơi bán.',
    icon: (
      <Icon>
        <path d="M4 6v12M7 6v12M10 6v12M14 6v12M16 6v12M20 6v12" />
      </Icon>
    ),
  },
  {
    title: 'Thông tin được kiểm duyệt',
    text: 'Người dùng đề xuất sửa thông tin sai, quản trị viên duyệt trước khi hiển thị.',
    icon: (
      <Icon>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </Icon>
    ),
  },
]

// Minh họa cách đối chiếu INCI trong thẻ tính năng lớn
const INCI_DEMO = [
  { a: 'Water', b: 'Aqua', tag: 'Tương đương', kind: 'same' },
  { a: 'Niacinamide', b: 'Niacinamide', tag: 'Chung', kind: 'same' },
  { a: 'Fragrance', b: '—', tag: 'Chỉ ở A', kind: 'a' },
  { a: '—', b: 'Panthenol', tag: 'Chỉ ở B', kind: 'b' },
]

const STEPS = [
  { title: 'Chọn sản phẩm A', text: 'Tìm theo tên, thương hiệu hoặc mã vạch.' },
  { title: 'Nhận gợi ý sản phẩm B', text: 'Hệ thống đề xuất sản phẩm cùng loại để so cho công bằng.' },
  { title: 'Xem khác biệt', text: 'Giá, giá theo dung tích, đánh giá và từng chất trong bảng thành phần.' },
]

const FAQ = [
  {
    question: 'Dữ liệu lấy từ đâu?',
    answer:
      'Thông tin được thu thập từ các sàn bán mỹ phẩm. Giá và tồn kho có thể thay đổi, hãy kiểm tra lại trên trang bán trước khi mua.',
  },
  {
    question: 'Giá theo ml / g được tính thế nào?',
    answer: 'Giá bán chia cho dung tích ghi trên sản phẩm, đưa về cùng đơn vị để so sánh trực tiếp hai chai khác cỡ.',
  },
  {
    question: '"Trùng thành phần" nghĩa là gì?',
    answer:
      'Tỉ lệ chất INCI có ở cả hai sản phẩm. Các tên gọi khác nhau của cùng một chất (vd. Water và Aqua) được tính là một.',
  },
  {
    question: 'Thấy thông tin sai thì làm sao?',
    answer:
      'Ở trang so sánh, bạn có thể gửi đề xuất sửa cho sản phẩm được bật tính năng này. Quản trị viên duyệt trước khi hiển thị.',
  },
]

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProductTile({ product }: { product: ProductSummary }) {
  return (
    <li>
      <Link href={compareUrl({ a: product.id })} className="product-tile">
        <span className="product-tile-image">
          {product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <span className="img-placeholder" />}
        </span>
        <span className="product-tile-body">
          <span className="product-tile-brand">{product.brand ?? '—'}</span>
          <span className="product-tile-name">{product.name}</span>
          <span className="product-tile-price">{formatPrice(product.price)}</span>
        </span>
        <span className="product-tile-action">So sánh</span>
      </Link>
    </li>
  )
}

function BestSellers({ categories }: { categories: FilterOption[] }) {
  const [active, setActive] = useState<FilterOption | undefined>()
  const [products, setProducts] = useState<ProductSummary[] | null>(null)
  const current = active ?? categories[0]

  useEffect(() => {
    if (!current) return
    const controller = new AbortController()
    setProducts(null)
    searchProducts('', { categoryId: current.id }, controller.signal, TOP_PRODUCTS)
      .then(setProducts)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setProducts([])
      })
    return () => controller.abort()
  }, [current])

  if (!current) return null
  return (
    <section className="home-section" aria-labelledby="best-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Bán chạy</p>
          <h2 id="best-title">Được mua nhiều nhất theo danh mục</h2>
        </div>
        <Link href={compareUrl({ category: current.id })} className="section-link">
          So sánh {current.name.toLowerCase()} →
        </Link>
      </div>
      <div className="category-tabs" role="tablist" aria-label="Danh mục">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={category.id === current.id}
            className="category-tab"
            onClick={() => setActive(category)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <ul className="product-grid" aria-busy={products === null}>
        {products === null
          ? Array.from({ length: TOP_PRODUCTS }, (_, i) => <li key={i} className="product-tile skeleton" />)
          : products.map((product) => <ProductTile key={product.id} product={product} />)}
      </ul>
    </section>
  )
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [brands, setBrands] = useState<FilterOption[]>([])
  const [sources, setSources] = useState<FilterOption[]>([])

  useEffect(() => {
    document.title = 'Cosmetic – So sánh mỹ phẩm'
    const controller = new AbortController()
    const { signal } = controller
    const ignore = () => {}
    getStats(signal).then(setStats).catch(ignore)
    listFeaturedCategories(signal).then(setCategories).catch(ignore)
    listBrands(undefined, signal)
      .then((items) => setBrands([...items].sort((a, b) => b.product_count - a.product_count).slice(0, TOP_BRANDS)))
      .catch(ignore)
    listSources(signal).then(setSources).catch(ignore)
    return () => controller.abort()
  }, [])

  const statItems = [
    { value: stats?.products, label: 'sản phẩm' },
    { value: stats?.brands, label: 'thương hiệu' },
    { value: stats?.products_with_inci, label: 'có bảng thành phần' },
    { value: stats?.sources, label: 'sàn thu thập' },
  ]

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-pill">
              <span className="preview-dot" aria-hidden="true" /> Dữ liệu từ{' '}
              {sources.length > 0 ? sources.map((s) => s.name).join(' & ') : 'các sàn'}
            </p>
            <h1>
              Mỹ phẩm nào <span className="highlight">đáng tiền</span> hơn?
            </h1>
            <p className="hero-lead">
              Đặt 2 sản phẩm cạnh nhau: giá, giá theo dung tích, đánh giá và từng chất trong bảng thành phần — trong vài
              giây.
            </p>
            <div className="hero-search">
              <ProductPicker
                label="Bắt đầu với một sản phẩm"
                value={null}
                onChange={(product) => product && navigate(compareUrl({ a: product.id }))}
                sources={sources}
                showFilters={false}
                placeholder="Tìm tên, thương hiệu, mã vạch…"
              />
            </div>
            {categories.length > 0 && (
              <div className="quick-categories">
                <span className="muted">Phổ biến:</span>
                {categories.slice(0, QUICK_CATEGORIES).map((category) => (
                  <Link key={category.id} href={compareUrl({ category: category.id })} className="chip-link">
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
            <ul className="hero-trust">
              <li>
                <Check /> Miễn phí, không cần đăng ký
              </li>
              <li>
                <Check /> Đối chiếu đến từng chất trong bảng thành phần
              </li>
            </ul>
          </div>
          <div className="hero-visual">
            <ComparePreview category={categories[0]} />
          </div>
        </div>
      </section>

      <div className="container">
        <ul className="stats-band">
          {statItems.map((item) => (
            <li key={item.label}>
              <strong>{item.value == null ? '—' : formatNumber(item.value)}</strong>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <section className="home-section" aria-labelledby="steps-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cách hoạt động</p>
              <h2 id="steps-title">Ba bước để chọn đúng</h2>
            </div>
          </div>
          <ol className="steps">
            {STEPS.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <p className="muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-section" aria-labelledby="features-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Có gì khi so sánh</p>
              <h2 id="features-title">Không chỉ là so giá</h2>
              <p className="muted">Những điều khó thấy khi đọc từng trang sản phẩm riêng lẻ.</p>
            </div>
          </div>
          <ul className="features">
            {FEATURES.map((feature) => (
              <li key={feature.title} className={feature.large ? 'feature-large' : undefined}>
                <span className="feature-icon-wrap">{feature.icon}</span>
                <strong>{feature.title}</strong>
                <p className="muted">{feature.text}</p>
                {feature.large && (
                  <>
                    <div className="inci-demo" role="img" aria-label="Minh họa: đối chiếu từng chất giữa sản phẩm A và B">
                      {INCI_DEMO.map((row) => (
                        <div key={row.tag}>
                          <span>{row.a}</span>
                          <span className={`tag tag-${row.kind}`}>{row.tag}</span>
                          <span>{row.b}</span>
                        </div>
                      ))}
                    </div>
                    <p className="inci-demo-note muted">Minh họa</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        <BestSellers categories={categories} />

        {brands.length > 0 && (
          <section className="home-section" aria-labelledby="brands-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Thương hiệu</p>
                <h2 id="brands-title">Nhiều sản phẩm nhất</h2>
              </div>
            </div>
            <ul className="brand-list">
              {brands.map((brand) => (
                <li key={brand.id}>
                  <Link href={compareUrl({ brand: brand.id })}>
                    {brand.name} <span className="muted">{formatNumber(brand.product_count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="home-section" aria-labelledby="faq-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Câu hỏi thường gặp</p>
              <h2 id="faq-title">Trước khi bắt đầu</h2>
            </div>
          </div>
          <div className="faq-list">
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p className="muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div>
            <h2>Sẵn sàng so sánh?</h2>
            <p>Chọn sản phẩm A, hệ thống gợi ý sản phẩm B cùng loại.</p>
          </div>
          <Link href="/compare" className="button primary">
            Bắt đầu so sánh
          </Link>
        </section>
      </div>
    </main>
  )
}
