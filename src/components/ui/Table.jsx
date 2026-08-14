import { cn } from '../../lib/utils'

/**
 * Composable table primitives.
 *
 * Usage:
 *   <Table>
 *     <Table.Head>
 *       <Table.Row>
 *         <Table.Th>Name</Table.Th>
 *       </Table.Row>
 *     </Table.Head>
 *     <Table.Body>
 *       <Table.Row>
 *         <Table.Td>John</Table.Td>
 *       </Table.Row>
 *     </Table.Body>
 *   </Table>
 */

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

function THead({ className, children, ...props }) {
  return (
    <thead className={cn('', className)} {...props}>
      {children}
    </thead>
  )
}

function TBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-slate-100', className)} {...props}>
      {children}
    </tbody>
  )
}

function TR({ className, hoverable = true, children, ...props }) {
  return (
    <tr
      className={cn(
        hoverable && 'transition-colors hover:bg-surface-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

function TH({ className, children, align = 'left', ...props }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

function TD({ className, children, align = 'left', ...props }) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-ink-soft',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}

Table.Head = THead
Table.Body = TBody
Table.Row = TR
Table.Th = TH
Table.Td = TD

export default Table
