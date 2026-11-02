import { useEffect, useState } from 'react'
import { compareProducts, getFeaturedPair, type CompareResponse, type FilterOption, type ProductInfo } from '../api'
import { formatNumber, formatPrice } from '../format'
import Link from './Link'

// Thẻ ví dụ ở trang chủ: so sánh thật 2 sản phẩm bán chạy cùng danh mục
export default function ComparePreview({ category }: { category: FilterOption | undefined }) {
  const [data, setData] = useState<CompareResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!category) return
    const controller = new AbortController()
    getFeaturedPair(category.id, controller.signal)
      .then((pair) => compareProducts(pair.product_a.id, pair.product_b.id, controller.signal))
      .then(setData)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setFailed(true)
      })
    return () => controller.abort()
  }, [category])

  if (failed) return null
  if (!data || !category) {
    return <div className="preview preview-loading" aria-hidden="true" />
  }

  const { product_a: a, product_b: b, differences: d } = data
  const unit = d.price_per_unit.unit
  const inci = d.inci.similarity_percent
  const rows: { label: string; a: string; b: string; best: 'a' | 'b' | null }[] = [
    { label: 'Giá bán', a: formatPrice(a.price), b: formatPrice(b.price), best: data.cheaper },
    {
      label: unit ? `Giá / ${unit}` : 'Giá / đơn vị',
      a: a.price_per_unit ? formatPrice(a.price_per_unit.value) : '—',
      b: b.price_per_unit ? formatPrice(b.price_per_unit.value) : '—',
      best: data.cheaper_per_unit,
    },
    {
      label: 'Đánh giá',
      a: a.rating_average != null ? `★ ${formatNumber(a.rating_average)}` : '—',
      b: b.rating_average != null ? `★ ${formatNumber(b.rating_average)}` : '—',
      best:
        a.rating_average == null || b.rating_average == null || a.rating_average === b.rating_average
          ? null
          : a.rating_average > b.rating_average
            ? 'a'
            : 'b',
    },
  ]

  return (
    <figure className="preview" aria-label={`Ví dụ so sánh ${a.name} và ${b.name}`}>
      <figcaption className="preview-caption">
        <span className="preview-dot" aria-hidden="true" /> Ví dụ so sánh thật · {category.name}
      </figcaption>
      <div className="preview-products">
        <PreviewProduct product={a} side="a" />
        <span className="preview-vs" aria-hidden="true">
          VS
        </span>
        <PreviewProduct product={b} side="b" />
      </div>
      <dl className="preview-rows">
        {rows.map((row) => (
          <div key={row.label} className="preview-row">
            <dd className={row.best === 'a' ? 'best' : undefined}>{row.a}</dd>
            <dt>{row.label}</dt>
            <dd className={row.best === 'b' ? 'best' : undefined}>{row.b}</dd>
          </div>
        ))}
      </dl>
      {inci != null && (
        <div className="preview-inci">
          <div className="preview-inci-label">
            <span>Trùng thành phần</span>
            <strong>{formatNumber(inci)}%</strong>
          </div>
          <div className="meter" role="presentation">
            <span style={{ width: `${Math.max(inci, 2)}%` }} />
          </div>
          <p className="muted">
            {d.inci.equivalent_count} chất chung · {d.inci.only_a_count} chỉ ở A · {d.inci.only_b_count} chỉ ở B
          </p>
        </div>
      )}
      <Link href={`/compare?a=${a.id}&b=${b.id}`} className="preview-cta">
        Xem so sánh đầy đủ →
      </Link>
    </figure>
  )
}

function PreviewProduct({ product, side }: { product: ProductInfo; side: 'a' | 'b' }) {
  return (
    <div className={`preview-product side-${side}`}>
      <span className="preview-badge">{side.toUpperCase()}</span>
      {product.image_url ? <img src={product.image_url} alt="" /> : <span className="img-placeholder" />}
      <span className="preview-brand">{product.brand}</span>
      <span className="preview-name">{product.name}</span>
    </div>
  )
}
