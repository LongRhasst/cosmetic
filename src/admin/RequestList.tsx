import { useCallback, useEffect, useState } from 'react'
import { adminApi, type AdminUpdateRequest, type RequestStatus, type UpdateRequestPage } from '../api'
import { formatDateTime } from '../format'

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
}

function ProductHeader({ request }: { request: AdminUpdateRequest }) {
  const { product } = request
  return (
    <div className="request-product">
      {product.image_url ? <img src={product.image_url} alt="" /> : <span className="img-placeholder" />}
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
  )
}

function Requester({ request }: { request: AdminUpdateRequest }) {
  const who = [request.requester_name, request.requester_contact].filter(Boolean).join(' · ') || 'Ẩn danh'
  return (
    <p className="muted request-meta">
      Gửi lúc {formatDateTime(request.created_at)} bởi {who}
      {request.requester_ip && ` (IP ${request.requester_ip})`}
    </p>
  )
}

function Value({ value, multiline }: { value: string | null; multiline: boolean }) {
  if (!value) return <span className="muted">(trống)</span>
  return multiline ? <div className="long-value">{value}</div> : <>{value}</>
}

function PendingRequest({ request, onDone }: { request: AdminUpdateRequest; onDone: () => void }) {
  // Giá trị admin sẽ duyệt (mặc định = đề xuất của member, sửa được); bỏ chọn = không duyệt trường đó
  const [values, setValues] = useState(() => Object.fromEntries(request.changes.map((c) => [c.field, c.proposed])))
  const [included, setIncluded] = useState(() => new Set(request.changes.map((c) => c.field)))
  const [reviewNote, setReviewNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(field: string) {
    const next = new Set(included)
    if (next.has(field)) next.delete(field)
    else next.add(field)
    setIncluded(next)
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      onDone()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const approve = () =>
    run(() =>
      adminApi.approve(
        request.id,
        Object.fromEntries(request.changes.filter((c) => included.has(c.field)).map((c) => [c.field, values[c.field]])),
        reviewNote,
      ),
    )
  const reject = () => run(() => adminApi.reject(request.id, reviewNote))

  return (
    <article className="request-card">
      <div className="request-card-head">
        <ProductHeader request={request} />
        <span className="badge status-pending">{STATUS_LABEL.pending}</span>
      </div>
      <Requester request={request} />
      {request.note && <p className="request-note">“{request.note}”</p>}

      <div className="table-wrap">
        <table className="request-changes">
          <colgroup>
            <col className="col-check" />
            <col className="col-field" />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Duyệt</span>
              </th>
              <th scope="col">Thông tin</th>
              <th scope="col">Đang hiển thị</th>
              <th scope="col">Đề xuất (sửa được trước khi duyệt)</th>
            </tr>
          </thead>
          <tbody>
            {request.changes.map((change) => {
              const on = included.has(change.field)
              return (
                <tr key={change.field} className={on ? undefined : 'excluded'}>
                  <td>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(change.field)}
                      aria-label={`Duyệt ${change.label}`}
                    />
                  </td>
                  <th scope="row">{change.label}</th>
                  <td>
                    <Value value={change.current} multiline={change.multiline} />
                  </td>
                  <td>
                    {change.multiline ? (
                      <textarea
                        rows={5}
                        value={values[change.field]}
                        disabled={!on}
                        onChange={(e) => setValues({ ...values, [change.field]: e.target.value })}
                        aria-label={`${change.label} được duyệt`}
                      />
                    ) : (
                      <input
                        value={values[change.field]}
                        disabled={!on}
                        onChange={(e) => setValues({ ...values, [change.field]: e.target.value })}
                        aria-label={`${change.label} được duyệt`}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="review-actions">
        <input
          className="review-note"
          placeholder="Ghi chú duyệt (không bắt buộc)"
          value={reviewNote}
          maxLength={2000}
          onChange={(e) => setReviewNote(e.target.value)}
          aria-label="Ghi chú duyệt"
        />
        <button type="button" className="button danger" disabled={busy} onClick={reject}>
          Từ chối
        </button>
        <button type="button" className="button primary" disabled={busy || included.size === 0} onClick={approve}>
          Duyệt {included.size < request.changes.length ? `${included.size}/${request.changes.length} mục` : ''}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </article>
  )
}

function ReviewedRequest({ request }: { request: AdminUpdateRequest }) {
  return (
    <article className="request-card">
      <div className="request-card-head">
        <ProductHeader request={request} />
        <span className={`badge status-${request.status}`}>{STATUS_LABEL[request.status]}</span>
      </div>
      <Requester request={request} />
      {request.note && <p className="request-note">“{request.note}”</p>}
      <div className="table-wrap">
        <table className="request-changes">
          <colgroup>
            <col className="col-field" />
            <col />
            <col />
            {request.status === 'approved' && <col />}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Thông tin</th>
              <th scope="col">{request.status === 'approved' ? 'Trước khi duyệt' : 'Đang hiển thị'}</th>
              <th scope="col">Đề xuất</th>
              {request.status === 'approved' && <th scope="col">Đã duyệt</th>}
            </tr>
          </thead>
          <tbody>
            {request.changes.map((change) => (
              <tr key={change.field}>
                <th scope="row">{change.label}</th>
                <td>
                  <Value value={change.current} multiline={change.multiline} />
                </td>
                <td>
                  <Value value={change.proposed} multiline={change.multiline} />
                </td>
                {request.status === 'approved' && (
                  <td>
                    {change.approved == null ? (
                      <span className="muted">Không duyệt</span>
                    ) : (
                      <Value value={change.approved} multiline={change.multiline} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted request-meta">
        {STATUS_LABEL[request.status]} lúc {formatDateTime(request.reviewed_at)} bởi {request.reviewed_by ?? '—'}
        {request.review_note && ` · “${request.review_note}”`}
      </p>
    </article>
  )
}

export default function RequestList() {
  const [status, setStatus] = useState<RequestStatus>('pending')
  const [page, setPage] = useState<UpdateRequestPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  // Tăng để tải lại danh sách sau khi duyệt/từ chối
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    adminApi
      .listRequests(status, 0, controller.signal)
      .then(setPage)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
    return () => controller.abort()
  }, [status, version])

  async function loadMore() {
    if (!page) return
    setLoadingMore(true)
    try {
      const next = await adminApi.listRequests(status, page.items.length)
      setPage({ ...next, items: [...page.items, ...next.items] })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section>
      <div className="segmented" role="group" aria-label="Lọc theo trạng thái">
        {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            className="segmented-item"
            aria-pressed={status === key}
            onClick={() => {
              setPage(null)
              setStatus(key)
            }}
          >
            {STATUS_LABEL[key]}
            {page && <span className="count">{page.counts[key]}</span>}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!page && !error && <p className="muted">Đang tải…</p>}
      {page && page.items.length === 0 && <p className="muted">Không có đề xuất nào.</p>}
      <div className="request-list">
        {page?.items.map((request) =>
          request.status === 'pending' ? (
            <PendingRequest key={request.id} request={request} onDone={reload} />
          ) : (
            <ReviewedRequest key={request.id} request={request} />
          ),
        )}
      </div>
      {page && page.items.length < page.total && (
        <button type="button" className="button load-more" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? 'Đang tải…' : `Xem thêm (${page.total - page.items.length})`}
        </button>
      )}
    </section>
  )
}
