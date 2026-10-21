/**
 * Live preview for the marks-entry screen.
 *
 * This file contains NO grading rules of its own. It is a table interpreter:
 * every threshold, band and grade point comes from the scale the backend
 * serves at GET /api/grading/scale. Saving still round-trips through the API,
 * and the marksheet always renders the server-computed result.
 */

export function previewRow(scale, { mseMarks, eseMarks, credits }) {
  const mse = toNumber(mseMarks)
  const ese = toNumber(eseMarks)

  if (mse === null || ese === null) {
    return { total: null, grade: '—', gradePoint: null, passed: null, failReason: null, credits }
  }

  const total = mse + ese
  const failsOnTotal = total < scale.minTotalToPass
  const failsOnEse = ese < scale.minEseToPass
  const passed = !failsOnTotal && !failsOnEse

  const band = scale.bands.find((b) => total >= b.minTotal) ?? scale.bands[scale.bands.length - 1]
  const grade = passed ? band.grade : scale.failGrade
  const gradePoint = passed
    ? band.point
    : (scale.bands.find((b) => b.grade === scale.failGrade)?.point ?? 0)

  return {
    total,
    grade,
    gradePoint,
    passed,
    failReason: failReason(scale, total, ese, failsOnTotal, failsOnEse),
    credits,
  }
}

function failReason(scale, total, ese, failsOnTotal, failsOnEse) {
  if (failsOnTotal && failsOnEse) {
    return `Total ${total}/${scale.totalMax} is below ${scale.minTotalToPass} and ESE ${ese}/${scale.eseMax} is below ${scale.minEseToPass}`
  }
  if (failsOnTotal) {
    return `Total ${total}/${scale.totalMax} is below the minimum of ${scale.minTotalToPass}`
  }
  if (failsOnEse) {
    return `ESE ${ese}/${scale.eseMax} is below the minimum of ${scale.minEseToPass}`
  }
  return null
}

/** SGPA across the previewed rows; null until every row has both marks. */
export function previewSgpa(rows) {
  const scored = rows.filter((r) => r.total !== null)
  if (scored.length === 0) return { sgpa: null, complete: false, failedCount: 0, totalCredits: 0 }

  const totalCredits = scored.reduce((sum, r) => sum + r.credits, 0)
  const weighted = scored.reduce((sum, r) => sum + r.gradePoint * r.credits, 0)

  return {
    sgpa: totalCredits === 0 ? 0 : round2(weighted / totalCredits),
    complete: scored.length === rows.length,
    failedCount: scored.filter((r) => r.passed === false).length,
    totalCredits,
  }
}

/** Field-level validation mirroring the server's bounds, for instant feedback. */
export function validateMark(scale, value, kind) {
  if (value === '' || value === null || value === undefined) return 'Required'

  const n = Number(value)
  if (!Number.isFinite(n)) return 'Must be a number'
  if (!Number.isInteger(n)) return 'Must be a whole number'
  if (n < 0) return 'Cannot be negative'

  const max = kind === 'mse' ? scale.mseMax : scale.eseMax
  if (n > max) return `Cannot exceed ${max}`

  return null
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
