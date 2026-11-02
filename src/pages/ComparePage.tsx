import { useEffect, useState } from 'react'
import {
  compareProducts,
  getCategory,
  getProduct,
  listSources,
  type CompareResponse,
  type FilterOption,
  type ProductSummary,
} from '../api'
import CompareResult from '../components/CompareResult'
import Logo from '../components/Logo'
import ProductPicker from '../components/ProductPicker'

// URL dạng /compare?a=12&b=34 để chia sẻ được kết quả so sánh;
// ?brand=5 / ?category=78 lọc sẵn thương hiệu / danh mục khi chọn sản phẩm A
function readParams() {
  const params = new URLSearchParams(window.location.search)
  const toId = (key: string) => {
    const value = Number(params.get(key))
    return Number.isInteger(value) && value > 0 ? value : undefined
  }
  return { a: toId('a'), b: toId('b'), brand: toId('brand'), category: toId('category') }
}

function writeParams(a: ProductSummary | null, b: ProductSummary | null) {
  const params = new URLSearchParams()
  if (a) params.set('a', String(a.id))
  if (a && b) params.set('b', String(b.id))
  const query = params.toString()
  window.history.replaceState(null, '', `/compare${query ? `?${query}` : ''}`)
}

export default function ComparePage() {
  const [initial] = useState(readParams)
  const [productA, setProductA] = useState<ProductSummary | null>(null)
  const [productB, setProductB] = useState<ProductSummary | null>(null)
  const [category, setCategory] = useState<FilterOption | undefined>()
  // Đang tải sản phẩm / danh mục từ URL thì chưa ghi đè URL
  const [ready, setReady] = useState(!initial.a && !initial.category)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<FilterOption[]>([])

  useEffect(() => {
    document.title = 'So sánh – Cosmetic'
    const controller = new AbortController()
    listSources(controller.signal)
      .then(setSources)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!initial.a && !initial.category) return
    const controller = new AbortController()
    Promise.all([
      initial.a ? getProduct(initial.a, controller.signal) : Promise.resolve(null),
      initial.a && initial.b ? getProduct(initial.b, controller.signal) : Promise.resolve(null),
      initial.category ? getCategory(initial.category, controller.signal) : Promise.resolve(undefined),
    ])
      .then(([a, b, c]) => {
        setProductA(a)
        setProductB(b)
        setCategory(c)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      // Lượt bị hủy (StrictMode chạy effect 2 lần) không được đánh dấu xong, kẻo ô chọn hiện trước khi có dữ liệu
      .finally(() => {
        if (!controller.signal.aborted) setReady(true)
      })
    return () => controller.abort()
  }, [initial])

  useEffect(() => {
    if (ready) writeParams(productA, productB)
  }, [ready, productA, productB])

  useEffect(() => {
    setResult(null)
    if (!productA || !productB) return
    const controller = new AbortController()
    setError(null)
    setLoading(true)
    compareProducts(productA.id, productB.id, controller.signal)
      .then(setResult)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [productA, productB])

  function selectA(product: ProductSummary | null) {
    setProductA(product)
    // Sản phẩm B được gợi ý theo loại của A, nên chọn lại B khi đổi A
    setProductB(null)
  }

  function swap() {
    setProductA(productB)
    setProductB(productA)
  }

  return (
    <main className="compare-page">
      <section className="compare-hero">
        <div className="compare-hero-inner">
          <div className="page-heading">
            <p className="eyebrow">So sánh</p>
            <h1>So sánh mỹ phẩm</h1>
            <p className="muted">Chọn 2 sản phẩm cùng loại để xem chênh lệch giá, đánh giá, thành phần và phân loại.</p>
          </div>

          {!ready ? (
            <div className="pickers-panel pickers-loading" aria-busy="true">
              <p className="status">Đang tải sản phẩm…</p>
            </div>
          ) : (
            <div className="pickers-panel pickers">
              <ProductPicker
                label="Sản phẩm A"
                value={productA}
                onChange={selectA}
                sources={sources}
                defaultBrandId={initial.brand}
                defaultCategory={category}
              />
              <button
                type="button"
                className="swap"
                onClick={swap}
                disabled={!productA || !productB}
                aria-label="Đổi chỗ A và B"
                title="Đổi chỗ A và B"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <ProductPicker
                label="Sản phẩm B"
                value={productB}
                onChange={setProductB}
                sameTypeAs={productA?.id}
                sources={sources}
                disabled={!productA}
                placeholder={productA ? 'Tìm sản phẩm cùng loại…' : 'Chọn sản phẩm A trước'}
              />
            </div>
          )}
        </div>
      </section>

      <div className="container">
        {error && <p className="status error">{error}</p>}
        {loading && (
          <div className="result-skeleton" aria-busy="true" aria-label="Đang so sánh">
            <span />
            <span />
          </div>
        )}
        {ready && !error && !(productA && productB) && (
          <div className="compare-empty">
            <Logo />
            <h2>{productA ? 'Chọn sản phẩm B để so sánh' : 'Bắt đầu với sản phẩm A'}</h2>
            <p className="muted">
              {productA
                ? 'Danh sách B chỉ gợi ý các sản phẩm cùng loại với A, để phép so sánh công bằng.'
                : 'Tìm theo tên, thương hiệu, ID trên sàn hoặc mã vạch; có thể lọc theo sàn và thương hiệu.'}
            </p>
          </div>
        )}
        {result && <CompareResult data={result} />}
      </div>
    </main>
  )
}
