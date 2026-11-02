import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate } from '../router'

// Thẻ <a> điều hướng trong trang (không tải lại); Ctrl/Cmd + click vẫn mở tab mới như link thường
export default function Link({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }
  return <a href={href} onClick={handleClick} {...props} />
}
