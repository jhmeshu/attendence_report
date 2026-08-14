/**
 * Dummy data for Phase 1 — static dashboard preview.
 * Replaced by the real engine output in later phases.
 */

export const kpis = {
  overallAttendance: 90.4,
  present: 512,
  absent: 42,
  late: 138,
  earlyLeave: 67,
}

export const attendanceTrend = [
  { day: 'Jul 1', attendance: 94, late: 8 },
  { day: 'Jul 2', attendance: 91, late: 12 },
  { day: 'Jul 3', attendance: 89, late: 15 },
  { day: 'Jul 4', attendance: 87, late: 18 },
  { day: 'Jul 7', attendance: 92, late: 10 },
  { day: 'Jul 8', attendance: 90, late: 14 },
  { day: 'Jul 9', attendance: 88, late: 16 },
  { day: 'Jul 10', attendance: 93, late: 9 },
  { day: 'Jul 11', attendance: 86, late: 21 },
  { day: 'Jul 14', attendance: 91, late: 13 },
  { day: 'Jul 15', attendance: 89, late: 17 },
  { day: 'Jul 16', attendance: 90, late: 11 },
]

export const statusBreakdown = [
  { name: 'Present', value: 512, tone: '#008DFF' },
  { name: 'Absent', value: 42, tone: '#DC2626' },
  { name: 'Late', value: 138, tone: '#F59E0B' },
  { name: 'Early Leave', value: 67, tone: '#8B5CF6' },
]

export const lateAnalysis = [
  { range: '0–10 min', count: 52 },
  { range: '10–20 min', count: 41 },
  { range: '20–30 min', count: 28 },
  { range: '30–60 min', count: 12 },
  { range: '60+ min', count: 5 },
]

export const alerts = [
  {
    tone: 'danger',
    icon: 'alert',
    title: '8 employees have late rate above 50%',
    detail: 'Review recommended before month-end',
  },
  {
    tone: 'warning',
    icon: 'clock',
    title: '12 employees have frequent early leave',
    detail: 'Pattern detected over the last 2 weeks',
  },
  {
    tone: 'danger',
    icon: 'user',
    title: '4 employees have unusually high absence',
    detail: 'Absent rate exceeds 15% this month',
  },
]

export const flaggedEmployees = [
  {
    id: 'ESE019DHK',
    name: 'John Smith',
    attendance: 90,
    latePct: 56,
    lateDays: 12,
  },
  {
    id: 'ESE027DHK',
    name: 'Sarah Ahmed',
    attendance: 87,
    latePct: 61,
    lateDays: 13,
  },
  {
    id: 'ETSE104DHK',
    name: 'Arif Rahman',
    attendance: 84,
    latePct: 58,
    lateDays: 11,
  },
  {
    id: 'ESSQAE96DHK',
    name: 'Nadia Karim',
    attendance: 88,
    latePct: 53,
    lateDays: 10,
  },
  {
    id: 'EQA126DHK',
    name: 'Tanvir Hasan',
    attendance: 82,
    latePct: 64,
    lateDays: 14,
  },
]

export const recentRecords = [
  { name: 'Rakibul Huda', id: 'ESE019DHK', date: '2026-07-15', clockIn: '09:52', clockOut: '19:10', status: 'On Time', hours: '9:18' },
  { name: 'Tasnim Jahan', id: 'ETSE104DHK', date: '2026-07-15', clockIn: '10:24', clockOut: '19:30', status: 'Late', hours: '9:06' },
  { name: 'Yousha Farokey', id: 'ETSE87DHK', date: '2026-07-15', clockIn: '09:45', clockOut: '18:20', status: 'Early Leave', hours: '8:35' },
  { name: 'Tapu Mandal', id: 'ETQAE126DHK', date: '2026-07-15', clockIn: '—', clockOut: '—', status: 'Absent', hours: '—' },
  { name: 'Sohug Mullah', id: 'ESSQAE96DHK', date: '2026-07-15', clockIn: '09:58', clockOut: '19:05', status: 'On Time', hours: '9:07' },
  { name: 'Tonmoy George', id: 'ESE117DHK', date: '2026-07-15', clockIn: '10:41', clockOut: '19:45', status: 'Late', hours: '9:04' },
]
