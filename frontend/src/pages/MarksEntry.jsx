import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, FileText, Loader2, RotateCcw, Save, UserSearch } from 'lucide-react'
import { api } from '../lib/api'
import { previewRow, previewSgpa, validateMark } from '../lib/preview'
import { formatSgpa, initials } from '../lib/format'
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

export default function MarksEntry() {
  const { prn } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [scale, setScale] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const [selectedPrn, setSelectedPrn] = useState(prn ?? '')
  const [entries, setEntries] = useState({})
  const [baseline, setBaseline] = useState({})
  const [loadingMarks, setLoadingMarks] = useState(false)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState({})

  /* --- bootstrap --------------------------------------------------- */
  const load = useCallback(() => {
    setStatus('loading')
    Promise.all([api.listStudents(), api.listSubjects(), api.getGradingScale()])
      .then(([studentList, subjectList, gradingScale]) => {
        setStudents(studentList)
        setSubjects(subjectList)
        setScale(gradingScale)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    setSelectedPrn(prn ?? '')
  }, [prn])

  const student = useMemo(
    () => students.find((s) => s.prn === selectedPrn) ?? null,
    [students, selectedPrn],
  )

  /* --- load existing marks for the chosen student ------------------ */
  useEffect(() => {
    if (!student || subjects.length === 0) {
      setEntries({})
      setBaseline({})
      return
    }

    setLoadingMarks(true)
    api
      .listMarks(student.id)
      .then((marks) => {
        const next = {}
        subjects.forEach((subject) => {
          const existing = marks.find((m) => m.subjectId === subject.id)
          next[subject.id] = {
            mseMarks: existing ? String(existing.mseMarks) : '',
            eseMarks: existing ? String(existing.eseMarks) : '',
          }
        })
        setEntries(next)
        setBaseline(next)
        setTouched({})
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingMarks(false))
    // toast is stable from context; re-running on it would refetch needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, subjects])

  /* --- live preview ------------------------------------------------ */
  const rows = useMemo(() => {
    if (!scale) return []
    return subjects.map((subject) => {
      const entry = entries[subject.id] ?? { mseMarks: '', eseMarks: '' }
      return {
        subject,
        entry,
        preview: previewRow(scale, {
          mseMarks: entry.mseMarks,
          eseMarks: entry.eseMarks,
          credits: subject.credits,
        }),
        errors: {
          mse: touched[`${subject.id}-mse`] ? validateMark(scale, entry.mseMarks, 'mse') : null,
          ese: touched[`${subject.id}-ese`] ? validateMark(scale, entry.eseMarks, 'ese') : null,
        },
      }
    })
  }, [subjects, entries, scale, touched])

  const summary = useMemo(() => previewSgpa(rows.map((r) => r.preview)), [rows])

  const hasBlockingErrors = useMemo(() => {
    if (!scale) return true
    return subjects.some((subject) => {
      const entry = entries[subject.id] ?? { mseMarks: '', eseMarks: '' }
      return (
        validateMark(scale, entry.mseMarks, 'mse') !== null ||
        validateMark(scale, entry.eseMarks, 'ese') !== null
      )
    })
  }, [subjects, entries, scale])

  const dirty = useMemo(
    () => JSON.stringify(entries) !== JSON.stringify(baseline),
    [entries, baseline],
  )

  /* --- handlers ---------------------------------------------------- */
  const updateEntry = (subjectId, field, value) => {
    // Digits only, so a stray character can never reach the request body.
    const clean = value.replace(/[^\d]/g, '')
    setEntries((current) => ({
      ...current,
      [subjectId]: { ...current[subjectId], [field]: clean },
    }))
  }

  const markTouched = (subjectId, kind) =>
    setTouched((current) => ({ ...current, [`${subjectId}-${kind}`]: true }))

  const handleStudentChange = (value) => {
    setSelectedPrn(value)
    navigate(value ? `/marks/${value}` : '/marks', { replace: true })
  }

  const handleReset = () => {
    setEntries(baseline)
    setTouched({})
    toast.info('Reverted to the last saved marks.')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!student || !scale) return

    // Surface every field error at once rather than one at a time.
    const allTouched = {}
    subjects.forEach((s) => {
      allTouched[`${s.id}-mse`] = true
      allTouched[`${s.id}-ese`] = true
    })
    setTouched(allTouched)

    if (hasBlockingErrors) {
      toast.error('Fix the highlighted marks before saving. MSE is out of 30 and ESE is out of 70.')
      return
    }

    setSaving(true)
    try {
      const payload = subjects.map((subject) => ({
        subjectId: subject.id,
        mseMarks: Number(entries[subject.id].mseMarks),
        eseMarks: Number(entries[subject.id].eseMarks),
      }))

      const marksheet = await api.saveMarksForStudent(student.id, payload)
      setBaseline(entries)
      toast.success(
        `Saved. ${student.name} · SGPA ${formatSgpa(marksheet.sgpa)} · ${
          marksheet.status === 'PASS' ? 'Pass' : marksheet.status === 'FAIL' ? 'Fail' : 'Incomplete'
        }.`,
      )
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  /* --- render ------------------------------------------------------ */
  if (status === 'loading') return <EntrySkeleton />
  if (status === 'error') {
    return (
      <>
        <PageHeader eyebrow="Data entry" title="Marks entry" />
        <ErrorState message={error} onRetry={load} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Data entry"
        title="Marks entry"
        description="Record the MSE (out of 30) and ESE (out of 70) components. Totals, grades and SGPA preview live; the saved result is computed by the server."
        actions={
          student ? (
            <Link to={`/marksheet/${student.prn}`} className="btn-ghost">
              <FileText size={16} aria-hidden="true" />
              View marksheet
            </Link>
          ) : null
        }
      />

      <div className="card mb-6 p-4 sm:p-5">
        <label htmlFor="student-picker" className="label mb-2">
          Student
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            id="student-picker"
            value={selectedPrn}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="field sm:max-w-md"
          >
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.prn}>
                {s.prn} — {s.name} (Div {s.division})
              </option>
            ))}
          </select>

          {student && (
            <div className="flex items-center gap-3 sm:ml-auto">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/[0.12] text-xs font-bold text-accent-soft">
                {initials(student.name)}
              </span>
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-ink">{student.name}</p>
                <p className="truncate text-xs text-ink-faint">
                  {student.branch} · Division {student.division} · Semester {student.semester}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!student ? (
        <EmptyState
          icon={UserSearch}
          title="Choose a student to begin"
          description="Pick a student above to load their four subjects. Existing marks are filled in and can be edited."
        />
      ) : loadingMarks ? (
        <TableSkeleton />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_312px]">
            <div className="min-w-0 space-y-4">
              <MobileEntryCards
                rows={rows}
                onChange={updateEntry}
                onBlur={markTouched}
                scale={scale}
              />
              <DesktopEntryTable
                rows={rows}
                onChange={updateEntry}
                onBlur={markTouched}
                scale={scale}
              />

              <AnimatePresence>
                {rows.some((r) => r.preview.passed === false) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="rounded-2xl border border-fail/25 bg-fail/[0.05] p-4"
                  >
                    <div className="flex gap-3">
                      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-fail" aria-hidden="true" />
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-ink">Failing subjects in this sheet</p>
                        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
                          {rows
                            .filter((r) => r.preview.passed === false)
                            .map((r) => (
                              <li key={r.subject.id}>
                                <span className="font-semibold text-ink">{r.subject.shortName}</span>{' '}
                                — {r.preview.failReason}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <LivePanel
              summary={summary}
              rows={rows}
              dirty={dirty}
              saving={saving}
              onReset={handleReset}
              blocked={hasBlockingErrors}
            />
          </div>
        </form>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function MarkInput({ id, label, value, max, error, onChange, onBlur }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder="—"
        className={`field tnum w-full text-center ${error ? 'field-invalid' : ''}`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[0.68rem] font-medium text-fail">
          {error}
        </p>
      ) : (
        <p className="mt-1 text-[0.68rem] text-ink-faint">/ {max}</p>
      )}
    </div>
  )
}

function DesktopEntryTable({ rows, onChange, onBlur }) {
  return (
    <div className="card hidden overflow-hidden sm:block">
      <div className="scroll-slim overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <caption className="sr-only">Marks entry for each subject</caption>
          <thead>
            <tr className="border-b bg-surface-sunken/60 text-left">
              <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Subject
              </th>
              <th scope="col" className="w-24 px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
                MSE <span className="tnum font-normal normal-case">/30</span>
              </th>
              <th scope="col" className="w-24 px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
                ESE <span className="tnum font-normal normal-case">/70</span>
              </th>
              <th scope="col" className="w-24 px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Total
              </th>
              <th scope="col" className="w-20 px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Grade
              </th>
              <th scope="col" className="w-16 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Cr
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ subject, entry, preview, errors }) => (
              <tr key={subject.id} className="border-b align-top last:border-0">
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink">{subject.shortName}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    <span className="tnum">{subject.code}</span> · {subject.name}
                  </p>
                </td>
                <td className="px-3 py-4">
                  <MarkInput
                    id={`mse-${subject.id}`}
                    label={`MSE marks for ${subject.name}, out of 30`}
                    value={entry.mseMarks}
                    max={30}
                    error={errors.mse}
                    onChange={(v) => onChange(subject.id, 'mseMarks', v)}
                    onBlur={() => onBlur(subject.id, 'mse')}
                  />
                </td>
                <td className="px-3 py-4">
                  <MarkInput
                    id={`ese-${subject.id}`}
                    label={`ESE marks for ${subject.name}, out of 70`}
                    value={entry.eseMarks}
                    max={70}
                    error={errors.ese}
                    onChange={(v) => onChange(subject.id, 'eseMarks', v)}
                    onBlur={() => onBlur(subject.id, 'ese')}
                  />
                </td>
                <td className="px-3 py-4 text-right">
                  <motion.span
                    key={preview.total}
                    initial={{ opacity: 0.45 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16 }}
                    className="tnum text-base font-semibold text-ink"
                  >
                    {preview.total ?? '—'}
                  </motion.span>
                  {preview.total !== null && (
                    <span className="tnum block text-[0.68rem] text-ink-faint">/ 100</span>
                  )}
                </td>
                <td className="px-3 py-4 text-center">
                  <GradeChip grade={preview.grade} />
                </td>
                <td className="tnum px-5 py-4 text-right text-ink-muted">{subject.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MobileEntryCards({ rows, onChange, onBlur }) {
  return (
    <div className="grid gap-3 sm:hidden">
      {rows.map(({ subject, entry, preview, errors }) => (
        <div key={subject.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink">{subject.shortName}</p>
              <p className="mt-0.5 truncate text-xs text-ink-faint">
                <span className="tnum">{subject.code}</span> · {subject.credits} credits
              </p>
            </div>
            <GradeChip grade={preview.grade} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <span className="label mb-1.5">MSE</span>
              <MarkInput
                id={`m-mse-${subject.id}`}
                label={`MSE marks for ${subject.name}, out of 30`}
                value={entry.mseMarks}
                max={30}
                error={errors.mse}
                onChange={(v) => onChange(subject.id, 'mseMarks', v)}
                onBlur={() => onBlur(subject.id, 'mse')}
              />
            </div>
            <div>
              <span className="label mb-1.5">ESE</span>
              <MarkInput
                id={`m-ese-${subject.id}`}
                label={`ESE marks for ${subject.name}, out of 70`}
                value={entry.eseMarks}
                max={70}
                error={errors.ese}
                onChange={(v) => onChange(subject.id, 'eseMarks', v)}
                onBlur={() => onBlur(subject.id, 'ese')}
              />
            </div>
            <div>
              <span className="label mb-1.5">Total</span>
              <p className="tnum rounded-xl border bg-surface-sunken px-3 py-2.5 text-center text-sm font-semibold text-ink">
                {preview.total ?? '—'}
              </p>
              <p className="mt-1 text-[0.68rem] text-ink-faint">/ 100</p>
            </div>
          </div>

          {preview.failReason ? (
            <p className="mt-3 rounded-lg bg-fail/[0.07] px-3 py-2 text-[0.7rem] leading-relaxed text-fail">
              {preview.failReason}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function LivePanel({ summary, rows, dirty, saving, onReset, blocked }) {
  const status =
    summary.sgpa === null
      ? 'INCOMPLETE'
      : summary.failedCount > 0
        ? 'FAIL'
        : summary.complete
          ? 'PASS'
          : 'INCOMPLETE'

  return (
    <motion.aside
      variants={stagger()}
      initial="hidden"
      animate="show"
      className="xl:sticky xl:top-8 xl:self-start"
    >
      <motion.div variants={fadeRise} className="card relative overflow-hidden p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)' }}
        />

        <div className="relative">
          <p className="label">Live preview</p>

          <div className="mt-4 flex items-end gap-3">
            <p className="font-display text-[3.2rem] font-semibold leading-none text-ink">
              {summary.sgpa === null ? (
                <span className="tnum text-ink-faint">—</span>
              ) : (
                <CountUp value={summary.sgpa} decimals={2} duration={500} />
              )}
            </p>
            <span className="pb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              SGPA
            </span>
          </div>

          <div className="mt-4">
            <StatusPill status={status} />
          </div>

          <dl className="mt-5 space-y-2.5 border-t pt-4 text-xs">
            <Row label="Subjects scored">
              <span className="tnum">
                {rows.filter((r) => r.preview.total !== null).length}/{rows.length}
              </span>
            </Row>
            <Row label="Credits">
              <span className="tnum">{summary.totalCredits}</span>
            </Row>
            <Row label="Failing">
              <span className={`tnum ${summary.failedCount > 0 ? 'text-fail' : ''}`}>
                {summary.failedCount}
              </span>
            </Row>
          </dl>

          <p className="mt-4 text-[0.68rem] leading-relaxed text-ink-faint">
            This preview follows the grading scale served by the API. The stored result is
            recomputed on the server when you save.
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeRise} className="mt-4 flex flex-col gap-2.5">
        <button type="submit" disabled={saving || blocked || !dirty} className="btn-primary w-full">
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Save size={16} aria-hidden="true" />
              {dirty ? 'Save marks' : 'No changes to save'}
            </>
          )}
        </button>

        <button type="button" onClick={onReset} disabled={!dirty || saving} className="btn-ghost w-full">
          <RotateCcw size={15} aria-hidden="true" />
          Reset changes
        </button>
      </motion.div>
    </motion.aside>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="font-semibold text-ink">{children}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function EntrySkeleton() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="card mb-6 p-5">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <TableSkeleton />
    </>
  )
}

function TableSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_312px]">
      <div className="card divide-y p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-5">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-10 w-16 rounded-xl" />
            <Skeleton className="h-10 w-16 rounded-xl" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="card space-y-4 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-14 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}
