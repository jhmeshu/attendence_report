import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Table2,
  Upload,
  Settings,
  CheckCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'review', label: 'Needs Review', icon: AlertTriangle },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'records', label: 'Attendance Records', icon: Table2 },
  { id: 'upload', label: 'Upload Data', icon: Upload },
]

const SECONDARY = [{ id: 'settings', label: 'Settings', icon: Settings }]

/**
 * Sidebar — app navigation. Collapses to a top bar on small screens.
 * `active` and `onNavigate` are props so the shell owns routing state.
 * `flagCount` shows the live "Needs Review" badge; `statusText` describes
 * the loaded dataset in the footer.
 */
export function Sidebar({ active, onNavigate, mobileOpen, onMobileClose, flagCount = 0, statusText }) {
  const renderItem = (item) => {
    const isActive = item.id === active
    const Icon = item.icon
    const badge = item.id === 'review' ? flagCount : item.badge
    return (
      <button
        key={item.id}
        onClick={() => {
          onNavigate?.(item.id)
          onMobileClose?.()
        }}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand text-white shadow-sm'
            : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0',
            isActive ? 'text-white' : 'text-ink-faint group-hover:text-ink-soft',
          )}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {badge > 0 && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-brand-50 text-brand',
            )}
          >
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-surface transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
            <CheckCheck className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-ink">Attendance</p>
            <p className="text-[11px] text-ink-faint">Management Dashboard</p>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Menu
          </p>
          {NAV.map(renderItem)}

          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            System
          </p>
          {SECONDARY.map(renderItem)}
        </nav>

        {/* Footer / data status */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-lg bg-surface-muted p-3">
            <p className="text-xs font-semibold text-ink">
              {statusText ? 'Data loaded' : 'No data yet'}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {statusText ?? 'Upload CSV files to generate reports'}
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
