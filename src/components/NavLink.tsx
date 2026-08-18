import type { MouseEvent, ReactNode } from 'react'

/**
 * A real link that navigates client-side.
 *
 * Anything that takes you to another screen is a link, not a button. Screen
 * readers announce the two differently and TalkBack users navigate by link;
 * a button that changes the page is a lie about what will happen. It also
 * means middle-click, ctrl-click and "open in new tab" work, which they never
 * can on a button.
 *
 * The href is a genuine URL, so the browser shows it on hover, the keyboard
 * treats it as a link, and a modified click is left to the browser rather than
 * being swallowed by the router.
 */
export function NavLink({
  href,
  onNavigate,
  className,
  children,
  ...rest
}: {
  href: string
  onNavigate: () => void
  className?: string
  children: ReactNode
  'data-slug'?: string
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // A modified click means the reader wants a new tab or window. Only a
    // plain left click belongs to the router.
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    onNavigate()
  }

  return (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
