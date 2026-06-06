import type { HomeworkStatus } from './homework'
import type { UserRole } from './user'

export type HistoryAction =
  | 'create'
  | 'start'
  | 'submit'
  | 'grade'
  | 'regrade'
  | 'revise'
  | 'send_back'
  | 'force_grade'
  | 'soft_delete'
  | 'restore'
  | 'update'

export interface HistoryRecord {
  id: string
  homeworkId: string
  operatorId: string
  operatorName: string
  operatorRole: UserRole
  action: HistoryAction
  fromStatus?: HomeworkStatus
  toStatus?: HomeworkStatus
  remark?: string
  score?: number
  timestamp: string
}
