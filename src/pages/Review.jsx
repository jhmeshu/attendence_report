import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, Flag, UploadCloud } from 'lucide-react'

import { Card, Table, Badge, Button, EmptyState } from '../components/ui'
import { EmployeeReviewModal } from '../components/EmployeeReviewModal'
import { HistoricalNotice } from '../components/HistoricalNotice'
import { useAttendance } from '../store/attendanceContext'

/**
 * Employees Requiring Review (doc Phase 8).
 *
 * Lists employees flagged for high late rate (Phase 5) in the reporting month.
 * Clicking "View" opens the Employee Attendance Review modal with the
 * month-by-month comparison and daily history.
 *
 * Accepts an optional `selectedEmployeeId` from App so the dashboard can
 * deep-link straight into an employee's review.
 */
export function Review({ selectedEmployeeId, onClearSelection }) {
  const { status, report } = useAttendance()
  const [openId, setOpenId] = useState(null)

  // Deep-link: dashboard "View" sets selectedEmployeeId; open it here.
  useEffect(() => {
    if (selectedEmployeeId) {
      setOpenId(selectedEmployeeId)
      onClearSelection?.()
    }
  }, [selectedEmployeeId, onClearSelection])

  // The modal needs this employee's comparison + daily records.
  const active = useMemo(() => {
    if (!openId) return null
    const flagged = report?.flaggedEmployees?.find((e) => e.employeeId === openId)
    if (!flagged) return null
    const comparison = report.comparisons?.find(
      (c) => c.employeeId === openId && c.name === flagged.name,
    )
    return { flagged, comparison }
  }, [openId, report])

  if (status !== 'ready' || !report) {
    return (
      <EmptyState
        icon={UploadCloud}
        title="No attendance data yet"
        description="Upload your monthly attendance CSV files to identify employees requiring review."
      />
    )
  }

  if (report.flaggedEmployees.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No employees require review"
        description="All late rates are within the threshold for the reporting month."
      />
    )
  }

  return (
    <div className="space-y-6">
      <HistoricalNotice months={report.months} reportingMonth={report.reportingMonth} />
      <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-ink">
            {report.flaggedEmployees.length} employees require attendance review
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Late rate above {report.rules.highLateThreshold}% in the reporting
            month. Use the 3-month comparison to check whether this is a new or
            persistent pattern.
          </p>
        </div>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Flag className="h-[18px] w-[18px] text-danger" />
            <Card.Title>Employees Requiring Review</Card.Title>
          </div>
          <Badge tone="danger">{report.flaggedEmployees.length} flagged</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Head>
              <Table.Row hoverable={false}>
                <Table.Th>Employee</Table.Th>
                <Table.Th>Employee ID</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th align="right">Attendance</Table.Th>
                <Table.Th align="right">Late %</Table.Th>
                <Table.Th align="right">Late Days</Table.Th>
                <Table.Th align="right">Action</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {report.flaggedEmployees.map((e) => (
                <Table.Row key={`${e.employeeId}-${e.name}`}>
                  <Table.Td className="font-medium text-ink">{e.name}</Table.Td>
                  <Table.Td>
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-ink-soft">
                      {e.employeeId}
                    </code>
                  </Table.Td>
                  <Table.Td className="text-ink-muted">{e.department}</Table.Td>
                  <Table.Td align="right">{e.attendancePct}%</Table.Td>
                  <Table.Td align="right">
                    <Badge tone="danger">{e.latePct}%</Badge>
                  </Table.Td>
                  <Table.Td align="right">{e.lateDays}</Table.Td>
                  <Table.Td align="right">
                    <Button
                      variant="subtle"
                      size="sm"
                      rightIcon={Eye}
                      onClick={() => setOpenId(e.employeeId)}
                    >
                      View
                    </Button>
                  </Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      <EmployeeReviewModal
        open={!!active}
        comparison={active?.comparison ?? null}
        records={report.records}
        onClose={() => setOpenId(null)}
      />
    </div>
  )
}

export default Review