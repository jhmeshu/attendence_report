import { cn } from '../../lib/utils'

/**
 * Card — base surface container.
 * Use <Card.Header>, <Card.Body>, <Card.Footer> for structure.
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-slate-200/70 shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('px-5 py-3 border-t border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-sm font-semibold text-ink', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
Card.Title = CardTitle

export default Card
