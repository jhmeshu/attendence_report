import { cn } from '../../lib/utils'

/**
 * Status tone → classes. Used by Badge and other status displays.
 * Keep this map as the single source of truth for status colors.
 */
export const STATUS_TONES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-brand-50 text-brand ring-brand-600/20',
  neutral: 'bg-slate-100 text-ink-soft ring-slate-500/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
}

/**
 * Badge — small pill label for status, tags, counts.
 */
export function Badge({ tone = 'neutral', size = 'md', className, children, dot = false, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap',
        STATUS_TONES[tone],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-emerald-500': tone === 'success',
            'bg-amber-500': tone === 'warning',
            'bg-red-500': tone === 'danger',
            'bg-brand': tone === 'info',
            'bg-slate-400': tone === 'neutral',
            'bg-violet-500': tone === 'purple',
          })}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
