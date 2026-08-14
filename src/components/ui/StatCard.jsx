import { TrendingUp, TrendingDown } from 'lucide-react'
import Card from './Card.jsx'
import Badge from './Badge.jsx'
import { cn } from '../../lib/utils'

/**
 * StatCard — KPI tile with icon, value, label, and optional trend.
 * tone drives the icon chip color.
 */
export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = 'info',
  trend, // { direction: 'up'|'down', value: '5.2%' } optional
  className,
}) {
  const chipTone = {
    info: 'bg-brand-50 text-brand',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    neutral: 'bg-slate-100 text-ink-soft',
  }

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">
            {value}
          </p>
          {sublabel && (
            <p className="mt-1 text-xs text-ink-faint">{sublabel}</p>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              chipTone[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <Badge
            tone={trend.direction === 'up' ? 'success' : 'danger'}
            size="sm"
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </Badge>
          {trend.label && (
            <span className="text-xs text-ink-faint">{trend.label}</span>
          )}
        </div>
      )}
    </Card>
  )
}

export default StatCard
