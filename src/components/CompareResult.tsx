import { useState } from 'react'
import type { CompareResponse, NumericDiff, ProductInfo, SetDiff, ValueDiff } from '../api'
import InciTable from './InciTable'
import UpdateRequestDialog from './UpdateRequestDialog'
import { formatNumber, formatPercent, formatPrice, formatSigned } from '../format'

// "lower": giá trị nhỏ hơn là tốt hơn (giá); "higher": lớn hơn là tốt hơn (đánh giá, lượt mua)
type Better = 'lower' | 'higher'

interface MetricRow {
  label: string
  diff: NumericDiff
  better: Better
  format: (value: number) => string
}

function winner(diff: NumericDiff, better: Better): 'a' | 'b' | null {
  if (diff.a == null || diff.b == null || diff.a === diff.b) return null
  const bIsBigger = diff.b > diff.a
  return (better === 'higher') === bIsBigger ? 'b' : 'a'
}

function ProductCard({ product, side }: { product: ProductInfo; side: 'a' | 'b' }) {
  const [requesting, setRequesting] = useState(false)
  return (
    <article className={`product-card side-${side}`}>
      <div className="product-card-media">
        <span className="side-badge">{side.toUpperCase()}</span>
        {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span className="img-placeholder" />}
      </div>
      {product.brand && <p className="product-card-brand">{product.brand}</p>}
      <h3>{product.name}</h3>
      {product.english_name && <p className="muted">{product.english_name}</p>}
      <dl>
        <dt>Sàn</dt>
        <dd>
          {product.source ?? '—'}
          {product.external_id && <span className="muted"> · ID {product.external_id}</span>}
        </dd>
        <dt>Mã vạch</dt>
        <dd>{product.barcode ?? '—'}</dd>
        <dt>Nơi sản xuất</dt>
        <dd>{product.made_in ?? '—'}</dd>
        <dt>Thương hiệu</dt>
        <dd>
          {product.brand ?? '—'}
          {product.country && <span className="muted"> · {product.country}</span>}
        </dd>
        <dt>Giá</dt>
        <dd>
          <strong>{formatPrice(product.price)}</strong>
          {product.market_price != null && product.market_price !== product.price && (
            <s className="muted"> {formatPrice(product.market_price)}</s>
          )}
          {product.discount_percent ? <span className="discount">−{product.discount_percent}%</span> : null}
        </dd>
        <dt>Dung tích</dt>
        <dd>
          {product.volume ?? '—'}
          {product.price_per_unit && (
            <span className="muted">
              {' '}
              · {formatPrice(product.price_per_unit.value)}/{product.price_per_unit.unit}
            </span>
          )}
        </dd>
        <dt>Đánh giá</dt>
        <dd>
          {product.rating_average != null ? `★ ${formatNumber(product.rating_average)}` : '—'}
          <span className="muted"> ({formatNumber(product.rating_count)} đánh giá)</span>
        </dd>
        <dt>Đã bán</dt>
        <dd>{formatNumber(product.bought_count)}</dd>
        <dt>Danh mục</dt>
        <dd>{product.categories.join(', ') || '—'}</dd>
      </dl>
      {product.source_url && (
        <a className="source-link" href={product.source_url} target="_blank" rel="noreferrer">
          Xem trên {product.source ?? 'nguồn'} ↗
        </a>
      )}
      {product.description && (
        <details className="product-text">
          <summary>Mô tả</summary>
          <p>{product.description}</p>
        </details>
      )}
      {product.usage_text && (
        <details className="product-text">
          <summary>Hướng dẫn sử dụng</summary>
          <p>{product.usage_text}</p>
        </details>
      )}
      {product.edited_fields.length > 0 && (
        <p className="edited-note">✓ Đã cập nhật theo đề xuất được duyệt: {product.edited_fields.join(', ')}</p>
      )}
      {product.allow_update_requests && (
        <button type="button" className="link-button request-button" onClick={() => setRequesting(true)}>
          Đề xuất sửa thông tin
        </button>
      )}
      {requesting && <UpdateRequestDialog productId={product.id} onClose={() => setRequesting(false)} />}
    </article>
  )
}

function MetricsTable({ rows }: { rows: MetricRow[] }) {
  return (
    <div className="table-wrap">
      <table className="metrics">
        <thead>
          <tr>
            <th scope="col">Chỉ số</th>
            <th scope="col" className="col-a">A</th>
            <th scope="col" className="col-b">B</th>
            <th scope="col">Chênh lệch (B − A)</th>
            <th scope="col">% so với A</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, diff, better, format }) => {
            const best = winner(diff, better)
            return (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td className={best === 'a' ? 'best' : undefined}>{diff.a == null ? '—' : format(diff.a)}</td>
                <td className={best === 'b' ? 'best' : undefined}>{diff.b == null ? '—' : format(diff.b)}</td>
                <td>{formatSigned(diff.difference, format)}</td>
                <td>{formatPercent(diff.percent)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SameBadge({ same }: { same: boolean | null }) {
  if (same === null) return <span className="muted">Thiếu dữ liệu</span>
  return <span className={`badge ${same ? 'badge-same' : 'badge-diff'}`}>{same ? 'Giống nhau' : 'Khác nhau'}</span>
}

function ValueDiffTable({ rows }: { rows: { label: string; diff: ValueDiff }[] }) {
  return (
    <div className="table-wrap">
      <table className="values">
        <thead>
          <tr>
            <th scope="col">Thuộc tính</th>
            <th scope="col" className="col-a">A</th>
            <th scope="col" className="col-b">B</th>
            <th scope="col">So sánh</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, diff }) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{diff.a ?? '—'}</td>
              <td>{diff.b ?? '—'}</td>
              <td>
                <SameBadge same={diff.same} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Chips({ items, kind }: { items: string[]; kind: 'common' | 'a' | 'b' }) {
  if (items.length === 0) return <span className="muted">—</span>
  return (
    <span className="chips">
      {items.map((item) => (
        <span key={item} className={`chip chip-${kind}`}>
          {item}
        </span>
      ))}
    </span>
  )
}

function SetDiffRow({ label, diff }: { label: string; diff: SetDiff }) {
  return (
    <tr>
      <th scope="row">
        {label}
        {diff.similarity_percent != null && <span className="similarity">trùng {formatNumber(diff.similarity_percent)}%</span>}
      </th>
      <td>
        <Chips items={diff.common} kind="common" />
      </td>
      <td>
        <Chips items={diff.only_a} kind="a" />
      </td>
      <td>
        <Chips items={diff.only_b} kind="b" />
      </td>
    </tr>
  )
}

interface Highlight {
  label: string
  side: 'a' | 'b' | null
  detail: string
  meter?: number
}

// Kết luận khi không có bên nào hơn: thiếu số liệu hay bằng nhau
function tie(diff: NumericDiff) {
  return diff.a == null || diff.b == null ? 'Thiếu dữ liệu' : 'Ngang nhau'
}

function Highlights({ data }: { data: CompareResponse }) {
  const d = data.differences
  const unit = d.price_per_unit.unit
  const rating = winner(d.rating_average, 'higher')
  const inci = d.inci.similarity_percent
  const items: Highlight[] = [
    {
      label: 'Giá bán',
      side: data.cheaper,
      detail: data.cheaper ? `rẻ hơn ${formatPrice(Math.abs(d.price.difference ?? 0))}` : tie(d.price),
    },
    {
      label: unit ? `Giá / ${unit}` : 'Giá theo dung tích',
      side: data.cheaper_per_unit,
      detail:
        data.cheaper_per_unit && unit
          ? `rẻ hơn ${formatPrice(Math.abs(d.price_per_unit.difference ?? 0))}/${unit}`
          : unit
            ? tie(d.price_per_unit)
            : 'Khác đơn vị, không quy đổi được',
    },
    {
      label: 'Điểm đánh giá',
      side: rating,
      detail: rating
        ? `★ ${formatNumber(rating === 'a' ? d.rating_average.a : d.rating_average.b)} so với ★ ${formatNumber(
            rating === 'a' ? d.rating_average.b : d.rating_average.a,
          )}`
        : tie(d.rating_average),
    },
    {
      label: 'Trùng thành phần',
      side: null,
      detail: inci == null ? 'Chưa đủ dữ liệu INCI' : `${d.inci.equivalent_count} chất chung`,
      meter: inci ?? undefined,
    },
  ]
  return (
    <ul className="highlights">
      {items.map((item) => (
        <li key={item.label} className={item.side ? `highlight-${item.side}` : undefined}>
          <span className="highlight-label">{item.label}</span>
          {item.meter != null ? (
            <strong className="highlight-value">{formatNumber(item.meter)}%</strong>
          ) : item.side ? (
            <strong className="highlight-value">
              <span className={`side-chip side-chip-${item.side}`}>{item.side.toUpperCase()}</span> tốt hơn
            </strong>
          ) : (
            <strong className="highlight-value muted">—</strong>
          )}
          <span className="highlight-detail muted">{item.detail}</span>
          {item.meter != null && (
            <span className="meter" role="presentation">
              <span style={{ width: `${Math.max(item.meter, 2)}%` }} />
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

const SECTIONS = [
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'chenh-lech', label: 'Chênh lệch' },
  { id: 'thanh-phan', label: 'Thành phần' },
  { id: 'phan-loai', label: 'Phân loại' },
]

export default function CompareResult({ data }: { data: CompareResponse }) {
  const d = data.differences
  const unit = d.price_per_unit.unit
  const rows: MetricRow[] = [
    { label: 'Giá bán', diff: d.price, better: 'lower', format: formatPrice },
    { label: 'Giá gốc', diff: d.market_price, better: 'lower', format: formatPrice },
    { label: 'Giảm giá (%)', diff: d.discount_percent, better: 'higher', format: formatNumber },
    {
      label: unit ? `Giá / ${unit}` : 'Giá / đơn vị (khác đơn vị)',
      diff: d.price_per_unit,
      better: 'lower',
      format: formatPrice,
    },
    { label: 'Điểm đánh giá', diff: d.rating_average, better: 'higher', format: formatNumber },
    { label: 'Số đánh giá', diff: d.rating_count, better: 'higher', format: formatNumber },
    { label: 'Đã bán', diff: d.bought_count, better: 'higher', format: formatNumber },
  ]

  return (
    <section className="result" id="tong-quan">
      <nav className="result-nav" aria-label="Các phần kết quả">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.label}
          </a>
        ))}
      </nav>
      {data.same_barcode && (
        <p className="same-product">
          Cùng một sản phẩm (mã vạch <strong>{data.same_barcode}</strong>)
          {d.source.same === false && ` được bán trên ${data.product_a.source} và ${data.product_b.source}`}.
        </p>
      )}
      {data.same_type_by.length > 0 && (
        <p className="same-type">
          Cùng loại: <Chips items={data.same_type_by} kind="common" />
        </p>
      )}
      <Highlights data={data} />

      <div className="cards">
        <ProductCard product={data.product_a} side="a" />
        <ProductCard product={data.product_b} side="b" />
      </div>

      <h2 id="chenh-lech">Sàn &amp; thương hiệu</h2>
      <ValueDiffTable
        rows={[
          { label: 'Sàn', diff: d.source },
          { label: 'Thương hiệu', diff: d.brand },
        ]}
      />

      <h2>Chênh lệch</h2>
      <MetricsTable rows={rows} />

      <h2 id="thanh-phan">Bảng thành phần đối chiếu</h2>
      <InciTable inci={d.inci} />

      <h2 id="phan-loai">Hoạt chất &amp; phân loại</h2>
      <div className="table-wrap">
        <table className="sets">
          <thead>
            <tr>
              <th scope="col">Nhóm</th>
              <th scope="col">Chung</th>
              <th scope="col" className="col-a">Chỉ A</th>
              <th scope="col" className="col-b">Chỉ B</th>
            </tr>
          </thead>
          <tbody>
            <SetDiffRow label="Thành phần nổi bật" diff={d.ingredients} />
            <SetDiffRow label="Loại da" diff={d.skin_types} />
            {Object.entries(d.attributes).map(([name, diff]) => (
              <SetDiffRow key={name} label={name} diff={diff} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
