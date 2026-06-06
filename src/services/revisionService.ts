import type { Homework, FinalScoreRule } from '@/types/homework'

export const REVISION_THRESHOLD = 60

export function needsRevision(score: number | undefined): boolean {
  if (score === undefined) return false
  return score < REVISION_THRESHOLD
}

export function calculateFinalScore(
  homework: Homework,
  rule: FinalScoreRule
): number | undefined {
  if (homework.score === undefined) return undefined

  if (rule === 'original' || homework.revisionScore === undefined) {
    return homework.score
  }

  if (rule === 'average') {
    return Math.round((homework.score + homework.revisionScore) / 2)
  }

  return homework.score
}

export function getFinalScoreDisplay(homework: Homework): string {
  if (homework.score === undefined) return '-'

  if (homework.status === 'revised' && homework.revisionScore !== undefined) {
    const avg = Math.round((homework.score + homework.revisionScore) / 2)
    return `${homework.score} → ${homework.revisionScore} (平均: ${avg})`
  }

  return String(homework.score)
}

export function formatRevisionTime(minutes: number | undefined): string {
  if (minutes === undefined) return '-'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

export function hasRevisionCard(homework: Homework): boolean {
  return (
    homework.status === 'graded' &&
    homework.needsRevision === true &&
    homework.score !== undefined &&
    homework.score < REVISION_THRESHOLD
  )
}
