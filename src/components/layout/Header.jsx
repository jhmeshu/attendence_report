import { Menu, Search, Bell, X } from 'lucide-react'
import { Button } from '../ui'

/**
 * Header — top bar with mobile menu toggle, global employee search, and actions.
 *
 * `headerSearch` is `{ value, onChange, onSubmit }`. Typing updates `value`;
 * pressing Enter or clicking the search button calls `onSubmit(value)`, which
 * opens the Search Results page (see App.jsx).
 */
export function Header({ title, subtitle, onMenuClick, headerSearch }) {
  const query = headerSearch?.value ?? ''
  const onQueryChange = headerSearch?.onChange
  const onSubmit = headerSearch?.onSubmit

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (q) onSubmit?.(q)
  }
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
      <form onSubmit={handleSubmit} className="relative" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange?.(e.target.value)}
          placeholder="Search by name or employee ID…"
          className="h-9 w-40 rounded-lg border border-slate-200 bg-surface-subtle py-0 pl-9 pr-9 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand-100 sm:w-64"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange?.('')}
            className="absolute right-10 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-faint hover:text-ink-soft"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink-soft"
          aria-label="Search"
        >
          <Search className="mx-auto h-4 w-4" />
        </button>
      </form>

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
