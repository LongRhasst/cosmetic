// Kiểu dữ liệu khớp với schema của backend (backend/src/schemas)

export interface ProductSummary {
  id: number
  name: string
  brand: string | null
  price: number | null
  volume: string | null
  image_url: string | null
  source: string | null
  // id sản phẩm trên trang nguồn (Hasaki: product_id, LRP: sku)
  external_id: string | null
  categories: string[]
}

export interface FilterOption {
  id: number
  name: string
  product_count: number
}

export interface UnitPrice {
  value: number
  unit: string
}

export interface ProductInfo {
  id: number
  name: string
  english_name: string | null
  brand: string | null
  country: string | null
  source: string | null
  external_id: string | null
  barcode: string | null
  source_url: string | null
  image_url: string | null
  price: number | null
  market_price: number | null
  discount_percent: number | null
  volume: string | null
  made_in: string | null
  description: string | null
  usage_text: string | null
  price_per_unit: UnitPrice | null
  rating_average: number | null
  rating_count: number | null
  bought_count: number | null
  categories: string[]
  skin_types: string[]
  ingredients: string[]
  attributes: Record<string, string[]>
  // Member được gửi đề xuất sửa thông tin sản phẩm này
  allow_update_requests: boolean
  // Nhãn các trường đang hiển thị bản admin đã duyệt sửa
  edited_fields: string[]
}

export interface NumericDiff {
  a: number | null
  b: number | null
  difference: number | null
  percent: number | null
}

export interface UnitPriceDiff extends NumericDiff {
  unit: string | null
}

export interface ValueDiff {
  a: string | null
  b: string | null
  // null khi thiếu dữ liệu ở 1 bên
  same: boolean | null
}

export interface SetDiff {
  common: string[]
  only_a: string[]
  only_b: string[]
  similarity_percent: number | null
}

export interface InciRow {
  status: 'equivalent' | 'only_a' | 'only_b'
  name_a: string | null
  // Thứ tự trong bảng thành phần (1 = nhiều nhất)
  position_a: number | null
  name_b: string | null
  position_b: number | null
}

export interface InciComparison {
  available_a: boolean
  available_b: boolean
  equivalent_count: number
  only_a_count: number
  only_b_count: number
  similarity_percent: number | null
  rows: InciRow[]
}

export interface CompareResponse {
  product_a: ProductInfo
  product_b: ProductInfo
  same_type_by: string[]
  // Mã vạch chung: cùng 1 sản phẩm (vd. bán ở 2 sàn khác nhau)
  same_barcode: string | null
  cheaper: 'a' | 'b' | null
  cheaper_per_unit: 'a' | 'b' | null
  differences: {
    source: ValueDiff
    brand: ValueDiff
    price: NumericDiff
    market_price: NumericDiff
    discount_percent: NumericDiff
    price_per_unit: UnitPriceDiff
    rating_average: NumericDiff
    rating_count: NumericDiff
    bought_count: NumericDiff
    ingredients: SetDiff
    inci: InciComparison
    skin_types: SetDiff
    attributes: Record<string, SetDiff>
  }
}

export class ApiError extends Error {}

// status giúp phân biệt 401 (chưa đăng nhập) với các lỗi khác
export class ApiStatusError extends ApiError {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type Params = Record<string, string | number | boolean | undefined>

interface SendOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  params?: Params
  body?: unknown
  signal?: AbortSignal
}

async function send<T>(path: string, { method = 'GET', params = {}, body, signal }: SendOptions = {}): Promise<T> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const response = await fetch(`/api${path}?${query}`, {
    method,
    signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    // Lỗi kiểm tra dữ liệu của FastAPI trả detail dạng mảng
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail.map((d: { msg?: string }) => d.msg).join('; ')
          : `Lỗi ${response.status}`
    throw new ApiStatusError(detail, response.status)
  }
  return (response.status === 204 ? undefined : response.json()) as Promise<T>
}

function request<T>(path: string, params: Params, signal?: AbortSignal): Promise<T> {
  return send<T>(path, { params, signal })
}

export interface SearchFilters {
  sameTypeAs?: number
  sourceId?: number
  brandId?: number
  categoryId?: number
}

export function searchProducts(q: string, filters: SearchFilters, signal?: AbortSignal, limit = 20) {
  return request<ProductSummary[]>(
    '/products',
    {
      q,
      same_type_as: filters.sameTypeAs,
      source_id: filters.sourceId,
      brand_id: filters.brandId,
      category_id: filters.categoryId,
      limit,
    },
    signal,
  )
}

export function listSources(signal?: AbortSignal) {
  return request<FilterOption[]>('/sources', {}, signal)
}

export function listBrands(sourceId?: number, signal?: AbortSignal) {
  return request<FilterOption[]>('/brands', { source_id: sourceId }, signal)
}

export function compareProducts(productA: number, productB: number, signal?: AbortSignal) {
  return request<CompareResponse>('/products/compare', { product_a: productA, product_b: productB }, signal)
}

// ----- Member đề xuất sửa thông tin -----

export interface EditableFieldValue {
  field: string
  label: string
  multiline: boolean
  max_length: number
  value: string | null
}

export interface ProductEditable {
  product_id: number
  name: string
  allow_update_requests: boolean
  fields: EditableFieldValue[]
}

export interface UpdateRequestCreate {
  changes: Record<string, string>
  note?: string
  requester_name?: string
  requester_contact?: string
}

export function getEditable(productId: number, signal?: AbortSignal) {
  return send<ProductEditable>(`/products/${productId}/editable`, { signal })
}

export function submitUpdateRequest(productId: number, body: UpdateRequestCreate) {
  return send<{ id: number; status: RequestStatus }>(`/products/${productId}/update-requests`, { method: 'POST', body })
}

// ----- Admin -----

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface AdminInfo {
  id: number
  username: string
}

// JWT nằm trong cookie HttpOnly do backend đặt, FE không cần lưu access_token
export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  expires_at: string
  admin: AdminInfo
}

export interface ProductRef {
  id: number
  name: string
  brand: string | null
  source: string | null
  source_url: string | null
  external_id: string | null
  image_url: string | null
}

export interface ChangeItem {
  field: string
  label: string
  multiline: boolean
  current: string | null
  proposed: string
  approved: string | null
}

export interface AdminUpdateRequest {
  id: number
  product: ProductRef
  status: RequestStatus
  changes: ChangeItem[]
  note: string | null
  requester_name: string | null
  requester_contact: string | null
  requester_ip: string | null
  created_at: string
  review_note: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface UpdateRequestPage {
  items: AdminUpdateRequest[]
  total: number
  counts: Record<RequestStatus, number>
}

export interface OverrideItem {
  field: string
  label: string
  value: string
  original: string | null
  updated_at: string
}

export interface AdminProduct extends ProductRef {
  allow_update_requests: boolean
  pending_requests: number
  overrides: OverrideItem[]
}

export interface AdminProductPage {
  items: AdminProduct[]
  total: number
}

export interface AdminProductFilters {
  q?: string
  allowed?: boolean
  edited?: boolean
  sourceId?: number
}

export const adminApi = {
  login: (username: string, password: string) =>
    send<LoginResponse>('/admin/login', { method: 'POST', body: { username, password } }),
  logout: () => send<void>('/admin/logout', { method: 'POST' }),
  // Thu hồi mọi phiên đăng nhập của admin này trên mọi thiết bị
  logoutAll: () => send<void>('/admin/logout-all', { method: 'POST' }),
  me: (signal?: AbortSignal) => send<AdminInfo>('/admin/me', { signal }),
  listRequests: (status: RequestStatus, offset: number, signal?: AbortSignal) =>
    send<UpdateRequestPage>('/admin/update-requests', { params: { status, offset, limit: 20 }, signal }),
  approve: (id: number, changes: Record<string, string>, reviewNote: string) =>
    send<AdminUpdateRequest>(`/admin/update-requests/${id}/approve`, {
      method: 'POST',
      body: { changes, review_note: reviewNote || null },
    }),
  reject: (id: number, reviewNote: string) =>
    send<AdminUpdateRequest>(`/admin/update-requests/${id}/reject`, {
      method: 'POST',
      body: { review_note: reviewNote || null },
    }),
  listProducts: (filters: AdminProductFilters, offset: number, signal?: AbortSignal) =>
    send<AdminProductPage>('/admin/products', {
      params: {
        q: filters.q,
        allowed: filters.allowed,
        edited: filters.edited,
        source_id: filters.sourceId,
        offset,
        limit: 50,
      },
      signal,
    }),
  setAllow: (productId: number, allow: boolean) =>
    send<void>(`/admin/products/${productId}`, { method: 'PATCH', body: { allow_update_requests: allow } }),
  setAllowMany: (productIds: number[], allow: boolean) =>
    send<{ updated: number }>('/admin/products/allow-update-requests', {
      method: 'POST',
      body: { product_ids: productIds, allow_update_requests: allow },
    }),
  revertOverride: (productId: number, field: string) =>
    send<AdminProduct>(`/admin/products/${productId}/overrides/${field}`, { method: 'DELETE' }),
}

// ----- Trang chủ -----

export interface Stats {
  products: number
  brands: number
  sources: number
  products_with_inci: number
}

export function getStats(signal?: AbortSignal) {
  return request<Stats>('/stats', {}, signal)
}

export function getProduct(productId: number, signal?: AbortSignal) {
  return request<ProductSummary>(`/products/${productId}`, {}, signal)
}

export interface ProductPair {
  product_a: ProductSummary
  product_b: ProductSummary
}

export function listFeaturedCategories(signal?: AbortSignal) {
  return request<FilterOption[]>('/categories/featured', {}, signal)
}

export function getCategory(categoryId: number, signal?: AbortSignal) {
  return request<FilterOption>(`/categories/${categoryId}`, {}, signal)
}

export function getFeaturedPair(categoryId: number, signal?: AbortSignal) {
  return request<ProductPair>('/products/featured-pair', { category_id: categoryId }, signal)
}
