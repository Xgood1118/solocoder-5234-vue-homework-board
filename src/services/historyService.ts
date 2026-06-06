import { createHistoryRecord, getHistoryByHomework } from '@/db/historyDB'
import type { HistoryRecord, HistoryAction } from '@/types/history'
import type { HomeworkStatus } from '@/types/homework'
import type { User, UserRole } from '@/types/user'

export async function addHistoryRecord(params: {
  homeworkId: string
  operator: User
  action: HistoryAction
  fromStatus?: HomeworkStatus
  toStatus?: HomeworkStatus
  remark?: string
  score?: number
}): Promise<HistoryRecord> {
  const record = await createHistoryRecord({
    homeworkId: params.homeworkId,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    operatorRole: params.operator.role as UserRole,
    action: params.action,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    remark: params.remark,
    score: params.score,
    timestamp: new Date().toISOString(),
  })
  return record
}

export async function getHomeworkHistory(homeworkId: string): Promise<HistoryRecord[]> {
  return getHistoryByHomework(homeworkId)
}

export function getActionLabel(action: HistoryAction): string {
  const labels: Record<HistoryAction, string> = {
    create: '布置作业',
    start: '开始作业',
    submit: '提交作业',
    grade: '批改作业',
    regrade: '重新批改',
    revise: '提交订正',
    send_back: '打回重做',
    force_grade: '强制判分',
    soft_delete: '删除作业',
    restore: '恢复作业',
    update: '更新信息',
  }
  return labels[action] || action
}
