'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/third-audience',
    label: 'Bot Analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/third-audience/citations',
    label: 'LLM Traffic',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/third-audience/bots',
    label: 'Bot Management',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    href: '/third-audience/okf',
    label: 'OKF Bundle',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
        <circle cx="12" cy="12" r="2" />
        <line x1="8" y1="6" x2="10" y2="11" /><line x1="16" y1="6" x2="14" y2="11" />
        <line x1="8" y1="18" x2="10" y2="13" /><line x1="16" y1="18" x2="14" y2="13" />
      </svg>
    ),
  },
  {
    href: '/third-audience/health',
    label: 'System Health',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/third-audience/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="ta-sidebar">
      <div className="ta-sidebar-brand">
        <svg viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="#007aff" />
          <path d="M8 20l4-8 4 8M10 17h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="9" r="3" fill="#34c759" />
        </svg>
        <span>Third Audience</span>
      </div>
      {NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`ta-nav-item${pathname === item.href ? ' active' : ''}`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
