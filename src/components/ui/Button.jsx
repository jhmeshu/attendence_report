import { cn } from '../../lib/utils'

const VARIANTS = {
  primary:
    'bg-brand text-white hover:bg-brand-600 focus-visible:ring-brand-400 shadow-sm',
  secondary:
    'bg-white text-ink border border-slate-200 hover:bg-surface-muted focus-visible:ring-slate-300',
  ghost:
    'bg-transparent text-ink-soft hover:bg-surface-muted focus-visible:ring-slate-300',
  danger:
    'bg-danger text-white hover:bg-red-700 focus-visible:ring-red-400 shadow-sm',
  subtle:
    'bg-brand-50 text-brand hover:bg-brand-100 focus-visible:ring-brand-300',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
}

/**
 * Button — supports variants, sizes, left/right icons, loading state.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  isLoading = false,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        LeftIcon && <LeftIcon className="h-4 w-4" />
      )}
      {children}
      {!isLoading && RightIcon && <RightIcon className="h-4 w-4" />}
    </button>
  )
}

export default Button
