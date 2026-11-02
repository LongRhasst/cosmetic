import { useState } from 'react'
import type { InciComparison, InciRow } from '../api'
import { formatNumber } from '../format'

type Filter = 'all' | InciRow['status']

const STATUS_LABEL: Record<InciRow['status'], string> = {
  equivalent: 'Tương đương',
  only_a: 'Chỉ có ở A',
  only_b: 'Chỉ có ở B',
}

function Position({ value }: { value: number | null }) {
  return <td className="inci-position">{value ?? ''}</td>
}

export default function InciTable({ inci }: { inci: InciComparison }) {
  const [filter, setFilter] = useState<Filter>('all')

  if (!inci.available_a || !inci.available_b) {
    const missing = [!inci.available_a && 'A', !inci.available_b && 'B'].filter(Boolean).join(' và ')
    return <p className="muted">Sản phẩm {missing} chưa có bảng thành phần đầy đủ trên nguồn thu thập, chưa thể đối chiếu.</p>
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: inci.rows.length },
    { key: 'equivalent', label: STATUS_LABEL.equivalent, count: inci.equivalent_count },
    { key: 'only_a', label: STATUS_LABEL.only_a, count: inci.only_a_count },
    { key: 'only_b', label: STATUS_LABEL.only_b, count: inci.only_b_count },
  ]
  const rows = filter === 'all' ? inci.rows : inci.rows.filter((row) => row.status === filter)

  return (
    <>
      <div className="inci-summary">
        {inci.similarity_percent != null && (
          <span>
            Trùng <strong>{formatNumber(inci.similarity_percent)}%</strong> thành phần
          </span>
        )}
        <div className="inci-filters" role="group" aria-label="Lọc thành phần">
          {filters.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              className={`inci-filter inci-filter-${key}`}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap inci-wrap">
        <table className="inci">
          <colgroup>
            <col className="inci-col-position" />
            <col />
            <col />
            <col className="inci-col-position" />
            <col className="inci-col-status" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="inci-position" title="Thứ tự trong bảng thành phần của A">
                #A
              </th>
              <th scope="col" className="col-a">Thành phần A</th>
              <th scope="col" className="col-b">Thành phần B</th>
              <th scope="col" className="inci-position" title="Thứ tự trong bảng thành phần của B">
                #B
              </th>
              <th scope="col">Đối chiếu</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.status}-${row.position_a}-${row.position_b}`} className={`inci-${row.status}`}>
                <Position value={row.position_a} />
                <td>{row.name_a ?? <span className="muted">—</span>}</td>
                <td>{row.name_b ?? <span className="muted">—</span>}</td>
                <Position value={row.position_b} />
                <td>
                  <span className={`badge inci-badge-${row.status}`}>{STATUS_LABEL[row.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted note">
        # là thứ tự trong bảng thành phần (1 = hàm lượng cao nhất). Tên đồng nghĩa như Water / Aqua được tính là tương
        đương. Dữ liệu lấy từ trang sản phẩm của sàn nên có thể thiếu hoặc sai chính tả.
      </p>
    </>
  )
}
