import type { HomeworkStatus } from '@/types/homework'
import type { UserRole } from '@/types/user'
import { getStatusName } from '@/utils/subject'

export interface TransitionResult {
  valid: boolean
  reason: string
}

interface TransitionRule {
  from: HomeworkStatus
  to: HomeworkStatus
  allowedRoles: UserRole[]
  description: string
}

const TRANSITION_RULES: TransitionRule[] = [
  { from: 'todo', to: 'in_progress', allowedRoles: ['student'], description: '学生开始作业' },
  { from: 'todo', to: 'submitted', allowedRoles: ['student'], description: '学生直接提交作业' },
  { from: 'todo', to: 'graded', allowedRoles: ['teacher'], description: '老师强制判0分' },
  { from: 'in_progress', to: 'submitted', allowedRoles: ['student'], description: '学生提交作业' },
  { from: 'in_progress', to: 'graded', allowedRoles: ['teacher'], description: '老师判0分' },
  { from: 'submitted', to: 'graded', allowedRoles: ['teacher'], description: '老师批改作业' },
  { from: 'graded', to: 'graded', allowedRoles: ['teacher'], description: '老师重新批改' },
  { from: 'graded', to: 'revised', allowedRoles: ['student'], description: '学生提交订正' },
  { from: 'graded', to: 'submitted', allowedRoles: ['teacher'], description: '老师打回重做' },
  { from: 'revised', to: 'graded', allowedRoles: ['teacher'], description: '老师打回重新订正' },
  { from: 'revised', to: 'submitted', allowedRoles: ['teacher'], description: '老师打回重做' },
]

export function canTransition(
  fromStatus: HomeworkStatus,
  toStatus: HomeworkStatus,
  role: UserRole
): boolean {
  return TRANSITION_RULES.some(
    (rule) =>
      rule.from === fromStatus && rule.to === toStatus && rule.allowedRoles.includes(role)
  )
}

export function validateTransition(
  fromStatus: HomeworkStatus,
  toStatus: HomeworkStatus,
  role: UserRole
): TransitionResult {
  if (fromStatus === toStatus) {
    return { valid: true, reason: '状态未变化' }
  }

  const rule = TRANSITION_RULES.find(
    (r) => r.from === fromStatus && r.to === toStatus && r.allowedRoles.includes(role)
  )

  if (rule) {
    return { valid: true, reason: rule.description }
  }

  const hasAnyTransition = TRANSITION_RULES.some(
    (r) => r.from === fromStatus && r.to === toStatus
  )

  if (hasAnyTransition) {
    const roleName = role === 'teacher' ? '老师' : '学生'
    return { valid: false, reason: `${roleName}无权进行此操作` }
  }

  return { valid: false, reason: `不允许从「${getStatusName(fromStatus)}」转移到「${getStatusName(toStatus)}」` }
}

export function getValidTransitions(
  status: HomeworkStatus,
  role: UserRole
): HomeworkStatus[] {
  return TRANSITION_RULES.filter(
    (rule) => rule.from === status && rule.allowedRoles.includes(role)
  ).map((rule) => rule.to)
}

export function getTransitionDescription(
  fromStatus: HomeworkStatus,
  toStatus: HomeworkStatus
): string {
  const rule = TRANSITION_RULES.find((r) => r.from === fromStatus && r.to === toStatus)
  return rule?.description || '状态变更'
}

export function canTeacherDrag(fromStatus: HomeworkStatus, toStatus: HomeworkStatus): boolean {
  return canTransition(fromStatus, toStatus, 'teacher')
}
