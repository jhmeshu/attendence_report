import { Card, Button } from '../components/ui'

/**
 * Lightweight placeholder for nav pages not yet built.
 * Keeps Phase 1 clickable without faking real functionality.
 */
export function Placeholder({ title, description, icon: Icon, phase }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        {Icon && (
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand">
            <Icon className="h-7 w-7" />
          </span>
        )}
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
        {phase && (
          <p className="mt-4 inline-block rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-soft">
            Coming in {phase}
          </p>
        )}
      </Card>
    </div>
  )
}

export default Placeholder
