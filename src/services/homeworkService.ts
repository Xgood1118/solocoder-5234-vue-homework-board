import {
  createHomework,
  getHomework,
  updateHomework,
  getAllHomeworks,
  softDeleteHomework,
  getHomeworksByStudent,
} from '@/db/homeworkDB'
import type {
  Homework,
  HomeworkCreateInput,
  HomeworkStatus,
  Subject,
} from '@/types/homework'
import type { User } from '@/types/user'
import { validateTransition } from './stateMachine'
import { addHistoryRecord } from './historyService'
import type { HistoryAction } from '@/types/history'

export interface TransitionOptions {
  score?: number
  comment?: string
  needsRevision?: boolean
  remark?: string
  attachments?: string[]
  revisionAttachments?: string[]
  revisionTime?: number
  revisionScore?: number
}

export async function createHomeworkService(
  input: HomeworkCreateInput,
  operator: User
): Promise<Homework> {
  const homework = await createHomework(input)

  await addHistoryRecord({
    homeworkId: homework.id,
    operator,
    action: 'create' as HistoryAction,
    toStatus: 'todo',
    remark: '老师布置作业',
  })

  return homework
}

export async function transitionHomeworkStatus(
  homeworkId: string,
  targetStatus: HomeworkStatus,
  operator: User,
  options: TransitionOptions = {}
): Promise<Homework | null> {
  const homework = await getHomework(homeworkId)
  if (!homework) return null

  const validation = validateTransition(homework.status, targetStatus, operator.role)
  if (!validation.valid && homework.status !== targetStatus) {
    throw new Error(validation.reason)
  }

  if (homework.status === targetStatus) {
    if (targetStatus === 'graded' && options.score !== undefined) {
      return regradeHomework(homeworkId, operator, options)
    }
    return homework
  }

  const now = new Date().toISOString()
  const updates: Partial<Homework> = {
    status: targetStatus,
    updatedAt: now,
  }

  let action: HistoryAction = 'update'

  switch (targetStatus) {
    case 'in_progress':
      updates.startedAt = now
      action = 'start'
      break
    case 'submitted':
      if (!homework.startedAt) updates.startedAt = now
      updates.submittedAt = now
      if (options.attachments) updates.attachments = options.attachments
      action = 'submit'
      break
    case 'graded':
      if (!homework.startedAt) updates.startedAt = now
      if (!homework.submittedAt) updates.submittedAt = now
      updates.gradedAt = now
      updates.score = options.score ?? 0
      updates.gradedBy = operator.id
      updates.gradedByName = operator.name
      updates.comment = options.comment || ''
      
      const isForceGrade = homework.status === 'todo' || homework.status === 'in_progress'
      if (options.needsRevision !== undefined) {
        updates.needsRevision = options.needsRevision
      } else if (isForceGrade) {
        updates.needsRevision = false
      } else {
        updates.needsRevision = (options.score ?? 0) < 60
      }
      
      action = homework.status === 'graded' ? 'regrade' : 'grade'
      if (isForceGrade) {
        action = 'force_grade'
      }
      break
    case 'revised':
      updates.revisedAt = now
      if (options.revisionScore !== undefined) updates.revisionScore = options.revisionScore
      if (options.revisionTime !== undefined) updates.revisionTime = options.revisionTime
      if (options.revisionAttachments) updates.revisionAttachments = options.revisionAttachments
      action = 'revise'
      break
  }

  if (homework.status === 'graded' && targetStatus === 'submitted') {
    action = 'send_back'
  }

  const updated = await updateHomework({ id: homeworkId, ...updates })

  await addHistoryRecord({
    homeworkId,
    operator,
    action,
    fromStatus: homework.status,
    toStatus: targetStatus,
    remark: options.remark,
    score: options.score,
  })

  return updated || null
}

export async function regradeHomework(
  homeworkId: string,
  operator: User,
  options: TransitionOptions
): Promise<Homework | null> {
  const homework = await getHomework(homeworkId)
  if (!homework) return null
  if (homework.status !== 'graded') return null
  if (operator.role !== 'teacher') {
    throw new Error('只有老师可以重新批改')
  }

  const now = new Date().toISOString()
  const updated = await updateHomework({
    id: homeworkId,
    score: options.score ?? homework.score,
    comment: options.comment ?? homework.comment,
    gradedBy: operator.id,
    gradedByName: operator.name,
    gradedAt: now,
    needsRevision: options.needsRevision ?? (options.score ?? homework.score ?? 0) < 60,
    updatedAt: now,
  })

  await addHistoryRecord({
    homeworkId,
    operator,
    action: 'regrade',
    fromStatus: 'graded',
    toStatus: 'graded',
    remark: options.remark || '重新批改',
    score: options.score,
  })

  return updated || null
}

export async function deleteHomeworkService(
  homeworkId: string,
  operator: User
): Promise<void> {
  if (operator.role !== 'teacher') {
    throw new Error('只有老师可以删除作业')
  }

  const homework = await getHomework(homeworkId)
  if (!homework) return

  await softDeleteHomework(homeworkId)

  await addHistoryRecord({
    homeworkId,
    operator,
    action: 'soft_delete',
    fromStatus: homework.status,
    remark: '老师删除作业',
  })
}

export async function getHomeworkById(id: string): Promise<Homework | undefined> {
  return getHomework(id)
}

export async function getAllHomeworkList(includeDeleted: boolean = false): Promise<Homework[]> {
  const homeworks = await getAllHomeworks(includeDeleted)
  return homeworks.sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  )
}

export async function getStudentHomeworks(
  studentId: string,
  includeDeleted: boolean = false
): Promise<Homework[]> {
  const homeworks = await getHomeworksByStudent(studentId, includeDeleted)
  return homeworks.sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  )
}

export function filterHomeworks(
  homeworks: Homework[],
  options: {
    subject?: Subject
    status?: HomeworkStatus
    studentId?: string
    search?: string
    sortByDeadline?: boolean
  }
): Homework[] {
  let result = [...homeworks]

  if (options.subject) {
    result = result.filter((h) => h.subject === options.subject)
  }

  if (options.status) {
    result = result.filter((h) => h.status === options.status)
  }

  if (options.studentId) {
    result = result.filter((h) => h.studentId === options.studentId)
  }

  if (options.search) {
    const keyword = options.search.toLowerCase()
    result = result.filter(
      (h) =>
        h.title.toLowerCase().includes(keyword) ||
        h.description.toLowerCase().includes(keyword) ||
        (h.comment && h.comment.toLowerCase().includes(keyword)) ||
        h.studentName.toLowerCase().includes(keyword)
    )
  }

  if (options.sortByDeadline) {
    result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  }

  return result
}

export function groupHomeworksByStatus(homeworks: Homework[]): Record<HomeworkStatus, Homework[]> {
  const groups: Record<string, Homework[]> = {
    todo: [],
    in_progress: [],
    submitted: [],
    graded: [],
    revised: [],
  }

  for (const hw of homeworks) {
    if (groups[hw.status]) {
      groups[hw.status].push(hw)
    }
  }

  return groups as Record<HomeworkStatus, Homework[]>
}

export function groupHomeworksByStudent(homeworks: Homework[]): Map<string, Homework[]> {
  const map = new Map<string, Homework[]>()
  for (const hw of homeworks) {
    if (!map.has(hw.studentId)) {
      map.set(hw.studentId, [])
    }
    map.get(hw.studentId)!.push(hw)
  }
  return map
}
