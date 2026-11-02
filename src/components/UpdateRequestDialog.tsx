import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { getEditable, submitUpdateRequest, type ProductEditable } from '../api'

interface Props {
  productId: number
  onClose: () => void
}

// Form đề xuất sửa thông tin sản phẩm (member không cần đăng nhập)
export default function UpdateRequestDialog({ productId, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formId = useId()
  const [product, setProduct] = useState<ProductEditable | null>(null)
  // Trường đang sửa -> giá trị mới
  const [changes, setChanges] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
    const controller = new AbortController()
    getEditable(productId, controller.signal)
      .then(setProduct)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
    return () => controller.abort()
  }, [productId])

  function toggleField(field: string, value: string | null) {
    setChanges((current) => {
      const next = { ...current }
      if (field in next) delete next[field]
      else next[field] = value ?? ''
      return next
    })
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await submitUpdateRequest(productId, {
        changes,
        note: note || undefined,
        requester_name: name || undefined,
        requester_contact: contact || undefined,
      })
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="dialog" onClose={onClose} aria-labelledby={`${formId}-title`}>
      <div className="dialog-header">
        <h2 id={`${formId}-title`}>Đề xuất sửa thông tin</h2>
        <button type="button" className="icon-button" onClick={() => dialogRef.current?.close()} aria-label="Đóng">
          ✕
        </button>
      </div>

      {done ? (
        <div className="dialog-body">
          <p>Cảm ơn bạn! Đề xuất đã được gửi và sẽ hiển thị sau khi quản trị viên duyệt.</p>
          <div className="dialog-actions">
            <button type="button" className="button primary" onClick={() => dialogRef.current?.close()}>
              Đóng
            </button>
          </div>
        </div>
      ) : !product ? (
        <p className={`dialog-body ${error ? 'error' : 'muted'}`}>{error ?? 'Đang tải…'}</p>
      ) : !product.allow_update_requests ? (
        <p className="dialog-body muted">Sản phẩm này chưa mở cho đề xuất cập nhật.</p>
      ) : (
        <form className="dialog-body" onSubmit={submit}>
          <p className="muted">{product.name}</p>
          <p className="hint">Chọn thông tin cần sửa và nhập giá trị đúng.</p>

          <ul className="field-list">
            {product.fields.map((field) => {
              const editing = field.field in changes
              const inputId = `${formId}-${field.field}`
              return (
                <li key={field.field} className={editing ? 'editing' : undefined}>
                  <label className="field-toggle">
                    <input type="checkbox" checked={editing} onChange={() => toggleField(field.field, field.value)} />
                    <span>{field.label}</span>
                  </label>
                  {editing ? (
                    <>
                      <label htmlFor={inputId} className="visually-hidden">
                        {field.label} mới
                      </label>
                      {field.multiline ? (
                        <textarea
                          id={inputId}
                          rows={6}
                          maxLength={field.max_length}
                          value={changes[field.field]}
                          onChange={(e) => setChanges({ ...changes, [field.field]: e.target.value })}
                          required
                        />
                      ) : (
                        <input
                          id={inputId}
                          type={field.field === 'image_url' ? 'url' : 'text'}
                          maxLength={field.max_length}
                          value={changes[field.field]}
                          onChange={(e) => setChanges({ ...changes, [field.field]: e.target.value })}
                          required
                        />
                      )}
                    </>
                  ) : (
                    <span className="field-current">{field.value || <span className="muted">(chưa có)</span>}</span>
                  )}
                </li>
              )
            })}
          </ul>

          <label className="form-label">
            Nguồn thông tin / ghi chú
            <textarea
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Vd. theo bao bì sản phẩm, website hãng…"
            />
          </label>
          <div className="form-row">
            <label className="form-label">
              Tên của bạn (không bắt buộc)
              <input maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="form-label">
              Liên hệ (không bắt buộc)
              <input
                maxLength={200}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email hoặc số điện thoại"
              />
            </label>
          </div>

          {error && <p className="error">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="button" onClick={() => dialogRef.current?.close()}>
              Hủy
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || Object.keys(changes).length === 0}
            >
              {submitting ? 'Đang gửi…' : 'Gửi đề xuất'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
