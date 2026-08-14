export { runEngine } from './runEngine.js'
export { processRecord } from './processRecord.js'
export { aggregateByEmployeeMonth } from './aggregate.js'
export { detectHighLate } from './flagging.js'
export { buildComparisons } from './comparison.js'
export { buildReport } from './buildReport.js'
export {
  evaluateArrival,
  evaluateDeparture,
  lateMinutes,
  workedMinutes,
  formatDuration,
} from './time.js'
export { DEFAULT_RULES, DEPARTMENT_CATEGORIES, WEEKEND_NAMES } from './config.js'
