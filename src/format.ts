const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

export function formatPrice(value: number | null | undefined): string {
  return value == null ? '—' : currency.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? '—' : number.format(value)
}

export function formatSigned(value: number | null | undefined, format: (v: number) => string = formatNumber): string {
  if (value == null) return '—'
  if (value === 0) return format(0)
  return `${value > 0 ? '+' : '−'}${format(Math.abs(value))}`
}

export function formatPercent(value: number | null | undefined): string {
  return value == null ? '—' : `${formatSigned(value)}%`
}

const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : '—'
}
