import { useEffect, useState } from 'react'
import { adminApi, listSources, type AdminProduct, type AdminProductFilters, type FilterOption } from '../api'
import { formatDateTime, formatNumber } from '../format'

type TriState = '' | 'true' | 'false'

const toBool = (value: TriState) => (value === '' ? undefined : value === 'true')

function Overrides({ product, onChange }: { product: AdminProduct; onChange: (p: AdminProduct) => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function revert(field: string) {
    setBusy(field)
    setError(null)
    try {
      onChange(await adminApi.revertOverride(product.id, field))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="overrides">
      <table>
        <thead>
          <tr>
            <th scope="col">Thông tin</th>
            <th scope="col">Dữ liệu thu thập</th>
            <th scope="col">Đang hiển thị (đã duyệt)</th>
            <th scope="col">
              <span className="visually-hidden">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {product.overrides.map((o) => (
            <tr key={o.field}>
              <th scope="row">{o.label}</th>
              <td>
                <div className="long-value">{o.original || <span className="muted">(trống)</span>}</div>
              </td>
              <td>
                <div className="long-value">{o.value}</div>
                <span className="muted">{formatDateTime(o.updated_at)}</span>
              </td>
              <td>
                <button type="button" className="link-button" disabled={busy !== null} onClick={() => revert(o.field)}>
                  {busy === o.field ? 'Đang hoàn tác…' : 'Hoàn tác'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

export default function ProductList() {
  const [query, setQuery] = useState('')
  const [allowed, setAllowed] = useState<TriState>('')
  const [edited, setEdited] = useState<TriState>('')
  const [sourceId, setSourceId] = useState<number | undefined>()
  const [sources, setSources] = useState<FilterOption[]>([])
  const [items, setItems] = useState<AdminProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<number | null>(null)
  const [version, setVersion] = useState(0)

  const filters: AdminProductFilters = { q: query.trim(), allowed: toBool(allowed), edited: toBool(edited), sourceId }

  useEffect(() => {
    const controller = new AbortController()
    listSources(controller.signal)
      .then(setSources)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      adminApi
        .listProducts({ q: query.trim(), allowed: toBool(allowed), edited: toBool(edited), sourceId }, 0, controller.signal)
        .then((page) => {
          setItems(page.items)
          setTotal(page.total)
          setSelected(new Set())
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setError(e.message)
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, allowed, edited, sourceId, version])

  async function loadMore() {
    setLoading(true)
    try {
      const page = await adminApi.listProducts(filters, items.length)
      setItems([...items, ...page.items])
      setTotal(page.total)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function replace(product: AdminProduct) {
    setItems((current) => current.map((p) => (p.id === product.id ? product : p)))
  }

  async function toggle(product: AdminProduct) {
    const allow = !product.allow_update_requests
    replace({ ...product, allow_update_requests: allow })
    try {
      await adminApi.setAllow(product.id, allow)
    } catch (e) {
      replace(product)
      setError((e as Error).message)
    }
  }

  async function setMany(allow: boolean) {
    try {
      await adminApi.setAllowMany([...selected], allow)
      setVersion((v) => v + 1)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function select(id: number) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const allSelected = items.length > 0 && items.every((p) => selected.has(p.id))

  return (
    <section>
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Tìm theo tên, thương hiệu, ID trên sàn, mã vạch…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Tìm sản phẩm"
        />
        <select value={allowed} onChange={(e) => setAllowed(e.target.value as TriState)} aria-label="Cho phép đề xuất">
          <option value="">Mọi trạng thái đề xuất</option>
          <option value="true">Đang cho phép đề xuất</option>
          <option value="false">Chưa cho phép</option>
        </select>
        <select value={edited} onChange={(e) => setEdited(e.target.value as TriState)} aria-label="Thông tin đã sửa">
          <option value="">Mọi sản phẩm</option>
          <option value="true">Có thông tin đã duyệt sửa</option>
          <option value="false">Chưa sửa</option>
        </select>
        <select
          value={sourceId ?? ''}
          onChange={(e) => setSourceId(e.target.value ? Number(e.target.value) : undefined)}
          aria-label="Sàn"
        >
          <option value="">Tất cả sàn</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bulk-bar">
        <span className="muted">
          {formatNumber(total)} sản phẩm{selected.size > 0 && ` · đã chọn ${selected.size}`}
        </span>
        <button type="button" className="button" disabled={selected.size === 0} onClick={() => setMany(true)}>
          Cho phép đề xuất
        </button>
        <button type="button" className="button" disabled={selected.size === 0} onClick={() => setMany(false)}>
          Tắt đề xuất
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="admin-products">
          <colgroup>
            <col className="col-check" />
            <col />
            <col className="col-small" />
            <col className="col-small" />
            <col className="col-toggle" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((p) => p.id)))}
                  aria-label="Chọn tất cả sản phẩm đang hiển thị"
                />
              </th>
              <th scope="col">Sản phẩm</th>
              <th scope="col">Chờ duyệt</th>
              <th scope="col">Đã sửa</th>
              <th scope="col">Cho phép đề xuất</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                selected={selected.has(product.id)}
                expanded={expanded === product.id}
                onSelect={() => select(product.id)}
                onToggle={() => toggle(product)}
                onExpand={() => setExpanded(expanded === product.id ? null : product.id)}
                onChange={replace}
              />
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p className="muted">Đang tải…</p>}
      {!loading && items.length === 0 && <p className="muted">Không có sản phẩm phù hợp.</p>}
      {!loading && items.length < total && (
        <button type="button" className="button load-more" onClick={loadMore}>
          Xem thêm ({formatNumber(total - items.length)})
        </button>
      )}
    </section>
  )
}

interface RowProps {
  product: AdminProduct
  selected: boolean
  expanded: boolean
  onSelect: () => void
  onToggle: () => void
  onExpand: () => void
  onChange: (product: AdminProduct) => void
}

function ProductRow({ product, selected, expanded, onSelect, onToggle, onExpand, onChange }: RowProps) {
  return (
    <>
      <tr>
        <td>
          <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Chọn ${product.name}`} />
        </td>
        <td>
          <div className="request-product">
            {product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <span className="img-placeholder" />}
            <div>
              <strong>{product.name}</strong>
              <span className="muted">
                {[product.brand, product.source, product.external_id && `#${product.external_id}`].filter(Boolean).join(' · ')}
                {product.source_url && (
                  <>
                    {' · '}
                    <a href={product.source_url} target="_blank" rel="noreferrer">
                      Trang nguồn ↗
                    </a>
                  </>
                )}
              </span>
            </div>
          </div>
        </td>
        <td>{product.pending_requests > 0 ? <span className="badge status-pending">{product.pending_requests}</span> : '—'}</td>
        <td>
          {product.overrides.length > 0 ? (
            <button type="button" className="link-button" onClick={onExpand} aria-expanded={expanded}>
              {product.overrides.length} mục {expanded ? '▴' : '▾'}
            </button>
          ) : (
            '—'
          )}
        </td>
        <td>
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              checked={product.allow_update_requests}
              onChange={onToggle}
              aria-label={`Cho phép đề xuất cho ${product.name}`}
            />
            <span aria-hidden="true" />
          </label>
        </td>
      </tr>
      {expanded && product.overrides.length > 0 && (
        <tr className="overrides-row">
          <td colSpan={5}>
            <Overrides product={product} onChange={onChange} />
          </td>
        </tr>
      )}
    </>
  )
}
