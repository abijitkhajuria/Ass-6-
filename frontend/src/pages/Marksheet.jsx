import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, PencilLine, Printer, ScrollText } from 'lucide-react'
import { api } from '../lib/api'
import { formatNumber, formatSgpa, initials } from '../lib/format'
import { CountUp } from '../components/CountUp'
import {
  EASE,
  EmptyState,
  ErrorState,
  GradeChip,
  PageHeader,
  Skeleton,
  StatusPill,
  fadeRise,
  stagger,
} from '../components/Primitives'
import { useToast } from '../lib/ToastContext'

export default function Marksheet() {
  const { prn } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [students, setStudents] = useState([])
  const [sheet, setSheet] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [loadingSheet, setLoadingSheet] = useState(false)

  const load = useCallback(() => {
    setStatus('loading')
    api
      .listStudents()
      .then((data) => {
        setStudents(data)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (!prn) {
      setSheet(null)
      return
    }
    setLoadingSheet(true)
    api
      .getResult(prn)
      .then(setSheet)
      .catch((err) => {
        setSheet(null)
        toast.error(err.message)
      })
      .finally(() => setLoadingSheet(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prn])

  const selected = useMemo(() => students.find((s) => s.prn === prn) ?? null, [students, prn])

  if (status === 'loading') return <MarksheetSkeleton />
  if (status === 'error') {
    return (
      <>
        <PageHeader eyebrow="Result" title="Marksheet" />
        <ErrorState message={error} onRetry={load} />
      </>
    )
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow="Result"
          title="Marksheet"
          description="Select a student to see their official semester result card, ready to print on A4."
          actions={
            sheet ? (
              <>
                <Link to={`/marks/${sheet.student.prn}`} className="btn-ghost">
                  <PencilLine size={16} aria-hidden="true" />
                  Edit marks
                </Link>
                <button type="button" onClick={() => window.print()} className="btn-primary">
                  <Printer size={16} aria-hidden="true" />
                  Print / Save as PDF
                </button>
              </>
            ) : null
          }
        />

        <div className="card mb-6 p-4 sm:p-5">
          <label htmlFor="marksheet-picker" className="label mb-2">
            Student
          </label>
          <select
            id="marksheet-picker"
            value={prn ?? ''}
            onChange={(e) =>
              navigate(e.target.value ? `/marksheet/${e.target.value}` : '/marksheet')
            }
            className="field sm:max-w-md"
          >
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.prn}>
                {s.prn} — {s.name} (Div {s.division})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!prn ? (
        <div className="no-print">
          <EmptyState
            icon={ScrollText}
            title="No student selected"
            description="Pick a student above, or open a marksheet straight from the student list."
            action={
              <Link to="/students" className="btn-ghost">
                Browse students
              </Link>
            }
          />
        </div>
      ) : loadingSheet ? (
        <SheetSkeleton />
      ) : !sheet ? (
        <div className="no-print">
          <EmptyState
            icon={FileText}
            title="Marksheet unavailable"
            description={`No result could be loaded for PRN ${prn}.`}
            action={
              <Link to="/students" className="btn-ghost">
                Back to students
              </Link>
            }
          />
        </div>
      ) : (
        <ResultCard sheet={sheet} selected={selected} />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function ResultCard({ sheet, selected }) {
  const student = sheet.student ?? selected
  const empty = sheet.subjects.length === 0

  return (
    <motion.article
      key={student.prn}
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
      className="print-sheet card overflow-hidden print-avoid-break"
    >
      {/* --- header ---------------------------------------------- */}
      <motion.header
        variants={fadeRise}
        className="relative overflow-hidden border-b px-6 py-7 sm:px-8"
      >
        <div
          aria-hidden="true"
          className="no-print pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(620px 220px at 15% -30%, rgba(99,102,241,0.16), transparent 70%)',
          }}
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="no-print grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/[0.12] font-display text-base font-bold text-accent-soft">
              {initials(student.name)}
            </span>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Statement of semester result
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">
                {student.name}
              </h2>
              <p className="tnum mt-1.5 text-sm text-ink-muted">
                {student.prn} · {student.branch} · Division {student.division} · Semester{' '}
                {student.semester}
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <StatusPill status={sheet.status} />
          </div>
        </div>
      </motion.header>

      {empty ? (
        <div className="px-6 py-14 sm:px-8">
          <EmptyState
            icon={PencilLine}
            title="No marks recorded yet"
            description={`Nothing has been entered for ${student.name}. Record the MSE and ESE components to generate this marksheet.`}
            action={
              <Link to={`/marks/${student.prn}`} className="btn-primary">
                Enter marks
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* --- subject table --------------------------------- */}
          <motion.div variants={fadeRise} className="px-2 py-2 sm:px-4 sm:py-4">
            {/* Stacked cards under 640px; screen only, print always uses the table. */}
            <div className="no-print grid gap-3 px-2 pb-2 sm:hidden">
              {sheet.subjects.map((row) => (
                <div key={row.subjectId} className="card-flat p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{row.shortName}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-faint">
                        <span className="tnum">{row.code}</span> · {row.name}
                      </p>
                    </div>
                    <GradeChip grade={row.grade} />
                  </div>

                  <dl className="mt-3.5 grid grid-cols-4 gap-2 border-t pt-3 text-xs">
                    <Cell label="MSE" value={`${row.mseMarks}/30`} />
                    <Cell label="ESE" value={`${row.eseMarks}/70`} />
                    <Cell label="Total" value={`${row.total}`} emphasis />
                    <Cell label="Credits" value={`${row.credits}`} />
                  </dl>

                  {row.failReason ? (
                    <p className="mt-3 rounded-lg bg-fail/[0.07] px-3 py-2 text-[0.7rem] leading-relaxed text-fail">
                      {row.failReason}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="scroll-slim hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">
                  Subject-wise marks, grades and credits for {student.name}
                </caption>
                <thead>
                  <tr className="border-b text-left">
                    <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      Subject
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      MSE <span className="font-normal normal-case">/30</span>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      ESE <span className="font-normal normal-case">/70</span>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      Total <span className="font-normal normal-case">/100</span>
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      Grade
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      Point
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      Credits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.subjects.map((row, index) => (
                    <motion.tr
                      key={row.subjectId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, ease: EASE, delay: 0.12 + index * 0.05 }}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-ink">{row.name}</p>
                        <p className="tnum mt-0.5 text-xs text-ink-faint">
                          {row.code} · {row.shortName}
                        </p>
                        {row.failReason ? (
                          <p className="mt-1 text-[0.7rem] font-medium text-fail">
                            Failed: {row.failReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="tnum px-3 py-3.5 text-right text-ink-muted">{row.mseMarks}</td>
                      <td className="tnum px-3 py-3.5 text-right text-ink-muted">{row.eseMarks}</td>
                      <td className="tnum px-3 py-3.5 text-right font-semibold text-ink">
                        {row.total}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <GradeChip grade={row.grade} />
                      </td>
                      <td className="tnum px-3 py-3.5 text-right text-ink-muted">
                        {row.gradePoint}
                      </td>
                      <td className="tnum px-4 py-3.5 text-right text-ink-muted">{row.credits}</td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                      Total
                    </td>
                    <td colSpan={2} />
                    <td className="tnum px-3 py-3.5 text-right font-semibold text-ink">
                      {sheet.totalMarks}
                      <span className="font-normal text-ink-faint">/{sheet.maxMarks}</span>
                    </td>
                    <td colSpan={2} />
                    <td className="tnum px-4 py-3.5 text-right font-semibold text-ink">
                      {sheet.totalCredits}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>

          {/* --- summary ---------------------------------------- */}
          <motion.div variants={fadeRise} className="border-t px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid flex-1 grid-cols-2 gap-5 sm:max-w-md sm:grid-cols-4">
                <Metric label="Credits" value={sheet.totalCredits} />
                <Metric label="Earned" value={sheet.creditsEarned} />
                <Metric label="Percentage" value={`${formatNumber(sheet.percentage, 2)}%`} />
                <Metric
                  label="Failed"
                  value={sheet.failedSubjectCount}
                  tone={sheet.failedSubjectCount > 0 ? 'fail' : undefined}
                />
              </div>

              <div className="relative shrink-0 rounded-2xl border px-6 py-5 sm:text-right">
                <div
                  aria-hidden="true"
                  className="no-print pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      'radial-gradient(220px 120px at 80% 0%, rgba(99,102,241,0.16), transparent 70%)',
                  }}
                />
                <p className="relative label">SGPA</p>
                <p className="relative mt-1.5 font-display text-[2.9rem] font-bold leading-none text-ink">
                  <span className="no-print">
                    <CountUp value={sheet.sgpa} decimals={2} duration={1000} />
                  </span>
                  <span className="print-only tnum">{formatSgpa(sheet.sgpa)}</span>
                </p>
                <p className="relative mt-2 text-xs text-ink-faint">out of 10.00</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-ink-muted">
                A subject is failed when the total is below 40 or the ESE component is below 28.
                Any failed subject makes the semester result <span className="font-semibold">FAIL</span>.
              </p>
              <div className="shrink-0">
                <StatusPill status={sheet.status} />
              </div>
            </div>
          </motion.div>

          {/* --- print-only footer ------------------------------ */}
          <div className="print-only border-t px-6 py-5 text-[0.7rem]">
            <div className="flex items-end justify-between">
              <p>
                Generated on {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
                . This is a computer-generated statement.
              </p>
              <p className="border-t pt-1.5">Controller of Examinations</p>
            </div>
          </div>
        </>
      )}
    </motion.article>
  )
}

function Metric({ label, value, tone }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p
        className={`tnum mt-1.5 font-display text-xl font-semibold ${
          tone === 'fail' ? 'text-fail' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Cell({ label, value, emphasis }) {
  return (
    <div>
      <dt className="text-ink-faint">{label}</dt>
      <dd className={`tnum mt-0.5 font-semibold ${emphasis ? 'text-ink' : 'text-ink-muted'}`}>
        {value}
      </dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function MarksheetSkeleton() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="card mb-6 p-5">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <SheetSkeleton />
    </>
  )
}

function SheetSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 border-b px-8 py-7">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3.5 w-72" />
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-8 py-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t px-8 py-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-16 w-32 rounded-2xl" />
      </div>
    </div>
  )
}
