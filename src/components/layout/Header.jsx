import { Menu, Search, Bell } from 'lucide-react'
import { Button } from '../ui'

/**
 * Header — top bar with mobile menu toggle, search, and actions.
 */
export function Header({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-surface/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-soft hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-ink lg:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-ink-muted">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Search employees..."
          className="h-9 w-64 rounded-lg border border-slate-200 bg-surface-subtle pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <Button variant="secondary" size="icon" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
      </Button>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 pl-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-700 text-xs font-semibold text-white">
          MG
        </span>
        <div className="hidden leading-tight lg:block">
          <p className="text-sm font-medium text-ink">Management</p>
          <p className="text-[11px] text-ink-faint">Administrator</p>
        </div>
      </div>
    </header>
  )
}

export default Header
