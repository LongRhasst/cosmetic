import { useEffect, useId, useState } from 'react'
import { listBrands, searchProducts, type FilterOption, type ProductSummary } from '../api'
import { formatPrice } from '../format'

interface Props {
  label: string
  value: ProductSummary | null
  onChange: (product: ProductSummary | null) => void
  // Chỉ gợi ý sản phẩm cùng loại với sản phẩm này
  sameTypeAs?: number
  // Danh sách sàn cho bộ lọc (tải 1 lần ở App)
  sources: FilterOption[]
  disabled?: boolean
  placeholder?: string
  // Ẩn bộ lọc sàn / thương hiệu (vd. ô tìm kiếm ở trang chủ)
  showFilters?: boolean
  // Lọc sẵn theo thương hiệu này
  defaultBrandId?: number
  // Lọc sẵn theo danh mục này (hiện thành nhãn, bấm ✕ để bỏ)
  defaultCategory?: FilterOption
}

export default function ProductPicker({
  label,
  value,
  onChange,
  sameTypeAs,
  sources,
  disabled,
  placeholder,
  showFilters = true,
  defaultBrandId,
  defaultCategory,
}: Props) {
  const inputId = useId()
  const sourceSelectId = useId()
  const brandSelectId = useId()
  // Bộ lọc tùy chọn: undefined = không lọc
  const [sourceId, setSourceId] = useState<number | undefined>()
  const [brandId, setBrandId] = useState<number | undefined>(defaultBrandId)
  const [brands, setBrands] = useState<FilterOption[]>([])
  const [category, setCategory] = useState<FilterOption | undefined>(defaultCategory)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductSummary[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!showFilters) return
    const controller = new AbortController()
    listBrands(sourceId, controller.signal)
      .then(setBrands)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setBrands([])
      })
    return () => controller.abort()
  }, [sourceId, showFilters])

  useEffect(() => {
    if (!open || disabled) return
    const controller = new AbortController()
    // Báo "đang tìm" ngay, tránh hiện "Không có sản phẩm phù hợp" trong lúc chờ debounce
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      searchProducts(query, { sameTypeAs, sourceId, brandId, categoryId: category?.id }, controller.signal)
        .then(setResults)
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setError(e.message)
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, sameTypeAs, sourceId, brandId, category, open, disabled])

  if (value) {
    return (
      <div className="picker">
        <span className="picker-label">{label}</span>
        <div className="picker-selected">
          {value.image_url && <img src={value.image_url} alt="" />}
          <div className="picker-selected-text">
            <strong>{value.name}</strong>
            <span>
              {value.brand} · {formatPrice(value.price)}
              {value.source && ` · ${value.source}`}
              {value.external_id && ` #${value.external_id}`}
            </span>
          </div>
          <button type="button" className="link-button" onClick={() => onChange(null)}>
            Đổi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="picker">
      <label className="picker-label" htmlFor={inputId}>
        {label}
      </label>
      {showFilters && (
        <div className="picker-filters">
          <label htmlFor={sourceSelectId} className="visually-hidden">
            Sàn
          </label>
          <select
            id={sourceSelectId}
            value={sourceId ?? ''}
            disabled={disabled}
            onChange={(e) => {
              setSourceId(e.target.value ? Number(e.target.value) : undefined)
              // Thương hiệu được lọc theo sàn, nên bỏ chọn thương hiệu khi đổi sàn
              setBrandId(undefined)
            }}
          >
            <option value="">Tất cả sàn</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name} ({source.product_count})
              </option>
            ))}
          </select>
          <label htmlFor={brandSelectId} className="visually-hidden">
            Thương hiệu
          </label>
          <select
            id={brandSelectId}
            value={brandId ?? ''}
            disabled={disabled}
            onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name} ({brand.product_count})
              </option>
            ))}
          </select>
        </div>
      )}
      {category && (
        <p className="picker-category">
          Danh mục: <strong>{category.name}</strong>
          <button type="button" className="icon-button" onClick={() => setCategory(undefined)} aria-label="Bỏ lọc danh mục">
            ✕
          </button>
        </p>
      )}
      <input
        id={inputId}
        type="search"
        value={query}
        disabled={disabled}
        placeholder={placeholder ?? 'Tìm theo tên, thương hiệu, ID trên sàn hoặc mã vạch…'}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && !disabled && (
        <ul className="picker-results" role="listbox">
          {loading && <li className="picker-hint">Đang tìm…</li>}
          {error && <li className="picker-hint error">{error}</li>}
          {!loading && !error && results.length === 0 && <li className="picker-hint">Không có sản phẩm phù hợp</li>}
          {!loading &&
            results.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(product)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  {product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <span className="img-placeholder" />}
                  <span className="picker-result-text">
                    <span className="picker-result-name">{product.name}</span>
                    <span className="picker-result-meta">
                      {product.brand} · {formatPrice(product.price)}
                      {product.source && ` · ${product.source}`}
                      {product.external_id && ` #${product.external_id}`}
                      {product.categories.length > 0 && ` · ${product.categories.join(', ')}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
