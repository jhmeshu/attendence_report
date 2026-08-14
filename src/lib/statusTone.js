/**
 * Map an attendance status string to a Badge tone.
 * Single source of truth — reused once the engine is wired in.
 */
export function statusToTone(status) {
  const map = {
    'Present': 'success',
    'On Time': 'success',
    'Late': 'warning',
    'Early Leave': 'purple',
    'Absent': 'danger',
    'No Record': 'neutral',
    'Weekend Work': 'info',
    'Weekend': 'neutral',
  }
  return map[status] ?? 'neutral'
}
