import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  FileText,
  PencilLine,
  Search,
  Users,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { formatSgpa, initials } from '../lib/format'
import {
  EASE,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusPill,
  fadeRise,
  stagger,
} from '../components/Primitives'

const SORTS = {
  prn: (a, b) => a.prn.localeCompare(b.prn),
  name: (a, b) => a.name.localeCompare(b.name),
  sgpa: (a, b) => a.sgpa - b.sgpa,
}

export default function StudentList() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [division, setDivision] = useState('all')
  const [result, setResult] = useState('all')
  const [sortKey, setSortKey] = useState('sgpa')
  const [sortDir, setSortDir] = useState('desc')

  const load = () => {
    setStatus('loading')
    api
      .listStudentSummaries()
      .then((data) => {
        setRows(data)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }

  useEffect(load, [])

  const divisions = useMemo(
    () => [...new Set(rows.map((r) => r.division))].sort(),
    [rows],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const filtered = rows.filter((row) => {
      const matchesQuery =
        !needle ||
        row.name.toLowerCase().includes(needle) ||
        row.prn.toLowerCase().includes(needle) ||
        row.division.toLowerCase() === needle

      const matchesDivision = division === 'all' || row.division === division
      const matchesResult = result === 'all' || row.status === result

      return matchesQuery && matchesDivision && matchesResult
    })

    const compare = SORTS[sortKey]
    const sorted = [...filtered].sort(compare)
    return sortDir === 'desc' ? sorted.reverse() : sorted
  }, [rows, query, division, result, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'sgpa' ? 'desc' : 'asc')
    }
  }

  const clearFilters = () => {
    setQuery('')
    setDivision('all')
    setResult('all')
  }

  const filtersActive = query !== '' || division !== 'all' || result !== 'all'

  if (status === 'loading') return <ListSkeleton />
  if (status === 'error') {
    return (
      <>
        <PageHeader eyebrow="Cohort" title="Students" />
        <ErrorState message={error} onRetry={load} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Cohort"
        title="Students"
        description="Search by name or PRN, filter by division and result, and sort by SGPA."
        actions={
          <Link to="/marks" className="btn-primary">
            <PencilLine size={16} aria-hidden="true" />
            Enter marks
          </Link>
        }
      />

      <div className="card mb-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <label htmlFor="student-search" className="sr-only">
              Search students by name or PRN
            </label>
            <input
              id="student-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or PRN…"
              className="field pl-10"
            />
          </div>

          <div>
            <label htmlFor="division-filter" className="sr-only">
              Filter by division
            </label>
            <select
              id="division-filter"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="field sm:w-44"
            >
              <option value="all">All divisions</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  Division {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="result-filter" className="sr-only">
              Filter by result
            </label>
            <select
              id="result-filter"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="field sm:w-40"
            >
              <option value="all">All results</option>
              <option value="PASS">Pass only</option>
              <option value="FAIL">Fail only</option>
              <option value="INCOMPLETE">Incomplete</option>
            </select>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t pt-3.5">
          <span className="text-xs text-ink-faint">
            Showing <span className="tnum font-semibold text-ink-muted">{visible.length}</span> of{' '}
            <span className="tnum">{rows.length}</span>
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-faint">Sort</span>
            {[
              { key: 'sgpa', label: 'SGPA' },
              { key: 'name', label: 'Name' },
              { key: 'prn', label: 'PRN' },
            ].map(({ key, label }) => (
              <SortButton
                key={key}
                label={label}
                active={sortKey === key}
                direction={sortDir}
                onClick={() => toggleSort(key)}
              />
            ))}
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="btn-quiet px-2.5 py-1.5 text-xs">
                <X size={13} aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={rows.length === 0 ? 'No students yet' : 'No students match those filters'}
          description={
            rows.length === 0
              ? 'Seed the database or add students, then record their marks.'
              : 'Try a different search term, or clear the filters to see the whole cohort.'
          }
          action={
            filtersActive ? (
              <button type="button" onClick={clearFilters} className="btn-ghost">
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <MobileCards rows={visible} />
          <DesktopTable rows={visible} sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
        </>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

function SortButton({ label, active, direction, onClick }) {
  const Icon = !active ? ArrowDownUp : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150',
        active
          ? 'bg-accent/[0.12] text-accent-soft'
          : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
      ].join(' ')}
    >
      {label}
      <Icon size={12} aria-hidden="true" />
    </button>
  )
}

/** Below 640px the table becomes stacked label/value cards. */
function MobileCards({ rows }) {
  return (
    <motion.ul variants={stagger()} initial="hidden" animate="show" className="grid gap-3 sm:hidden">
      {rows.map((row) => (
        <motion.li key={row.id} variants={fadeRise} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/[0.12] text-xs font-bold text-accent-soft">
                {initials(row.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{row.name}</p>
                <p className="tnum truncate text-xs text-ink-faint">{row.prn}</p>
              </div>
            </div>
            <StatusPill status={row.status} />
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-3.5 text-xs">
            <div>
              <dt className="text-ink-faint">Division</dt>
              <dd className="mt-0.5 font-semibold text-ink">{row.division}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">SGPA</dt>
              <dd className="tnum mt-0.5 font-semibold text-ink">{formatSgpa(row.sgpa)}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Subjects</dt>
              <dd className="tnum mt-0.5 font-semibold text-ink">{row.subjectsRecorded}/4</dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <Link to={`/marksheet/${row.prn}`} className="btn-ghost flex-1 py-2 text-xs">
              <FileText size={14} aria-hidden="true" />
              Marksheet
            </Link>
            <Link to={`/marks/${row.prn}`} className="btn-ghost flex-1 py-2 text-xs">
              <PencilLine size={14} aria-hidden="true" />
              Edit marks
            </Link>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  )
}

function DesktopTable({ rows, sortKey, sortDir, onSort }) {
  const ariaSort = (key) =>
    sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <div className="card hidden overflow-hidden sm:block">
      <div className="scroll-slim overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">
            Students with their computed SGPA and semester result
          </caption>
          <thead>
            <tr className="border-b bg-surface-sunken/60 text-left">
              <HeaderCell label="Student" sortable onClick={() => onSort('name')} ariaSort={ariaSort('name')} />
              <HeaderCell label="PRN" sortable onClick={() => onSort('prn')} ariaSort={ariaSort('prn')} />
              <HeaderCell label="Division" />
              <HeaderCell label="Subjects" align="right" />
              <HeaderCell
                label="SGPA"
                align="right"
                sortable
                onClick={() => onSort('sgpa')}
                ariaSort={ariaSort('sgpa')}
              />
              <HeaderCell label="Result" />
              <th scope="col" className="px-5 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <motion.tbody variants={stagger(0.02)} initial="hidden" animate="show">
            {rows.map((row) => (
              <motion.tr
                key={row.id}
                variants={fadeRise}
                className="group border-b transition-colors duration-150 last:border-0 hover:bg-surface-sunken/50"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/[0.12] text-[0.7rem] font-bold text-accent-soft">
                      {initials(row.name)}
                    </span>
                    <span className="font-medium text-ink">{row.name}</span>
                  </div>
                </td>
                <td className="tnum px-5 py-3.5 text-ink-muted">{row.prn}</td>
                <td className="px-5 py-3.5 text-ink-muted">{row.division}</td>
                <td className="tnum px-5 py-3.5 text-right text-ink-muted">
                  {row.subjectsRecorded}/4
                </td>
                <td className="tnum px-5 py-3.5 text-right font-semibold text-ink">
                  {formatSgpa(row.sgpa)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1 opacity-70 transition-opacity duration-150 group-hover:opacity-100">
                    <Link
                      to={`/marksheet/${row.prn}`}
                      className="btn-quiet px-2.5 py-1.5 text-xs"
                      aria-label={`View marksheet for ${row.name}`}
                    >
                      <FileText size={14} aria-hidden="true" />
                      Marksheet
                    </Link>
                    <Link
                      to={`/marks/${row.prn}`}
                      className="btn-quiet px-2.5 py-1.5 text-xs"
                      aria-label={`Edit marks for ${row.name}`}
                    >
                      <PencilLine size={14} aria-hidden="true" />
                      Edit
                    </Link>
                  </div>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  )
}

function HeaderCell({ label, align = 'left', sortable, onClick, ariaSort }) {
  return (
    <th
      scope="col"
      aria-sort={sortable ? ariaSort : undefined}
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-faint ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 rounded transition-colors duration-150 hover:text-ink ${
            align === 'right' ? 'flex-row-reverse' : ''
          }`}
        >
          {label}
          <ArrowDownUp size={11} aria-hidden="true" />
        </button>
      ) : (
        label
      )}
    </th>
  )
}

function ListSkeleton() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="card mb-5 p-5">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="card divide-y p-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </>
  )
}
