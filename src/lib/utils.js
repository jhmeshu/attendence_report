/**
 * Tiny className combiner — joins truthy class strings.
 * Avoids pulling in a dependency for a one-liner.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
