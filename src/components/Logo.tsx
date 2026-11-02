export default function Logo() {
  return (
    <svg className="logo-mark" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      {/* Hai chai mỹ phẩm đặt cạnh nhau: A và B */}
      <rect x="3" y="11" width="11" height="18" rx="3" fill="var(--a)" />
      <rect x="6" y="6" width="5" height="6" rx="1.5" fill="var(--a)" opacity="0.7" />
      <rect x="18" y="8" width="11" height="21" rx="3" fill="var(--b)" />
      <rect x="21" y="3" width="5" height="6" rx="1.5" fill="var(--b)" opacity="0.7" />
    </svg>
  )
}
