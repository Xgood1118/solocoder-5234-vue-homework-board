import type { Subject, HomeworkStatus } from '@/types/homework'

export const SUBJECT_CONFIG: Record<Subject, { name: string; color: string; bgColor: string; lightBg: string }> = {
  chinese: { name: '语文', color: '#dc2626', bgColor: 'bg-red-600', lightBg: 'bg-red-50' },
  math: { name: '数学', color: '#2563eb', bgColor: 'bg-blue-600', lightBg: 'bg-blue-50' },
  english: { name: '英语', color: '#7c3aed', bgColor: 'bg-violet-600', lightBg: 'bg-violet-50' },
  physics: { name: '物理', color: '#0891b2', bgColor: 'bg-cyan-600', lightBg: 'bg-cyan-50' },
  chemistry: { name: '化学', color: '#ea580c', bgColor: 'bg-orange-600', lightBg: 'bg-orange-50' },
  biology: { name: '生物', color: '#16a34a', bgColor: 'bg-green-600', lightBg: 'bg-green-50' },
}

export const STATUS_CONFIG: Record<HomeworkStatus, { name: string; color: string; bgColor: string; dotColor: string }> = {
  todo: { name: '待办', color: 'text-gray-700', bgColor: 'bg-gray-100', dotColor: 'bg-gray-400' },
  in_progress: { name: '进行中', color: 'text-blue-700', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500' },
  submitted: { name: '已提交', color: 'text-amber-700', bgColor: 'bg-amber-100', dotColor: 'bg-amber-500' },
  graded: { name: '已批改', color: 'text-purple-700', bgColor: 'bg-purple-100', dotColor: 'bg-purple-500' },
  revised: { name: '已订正', color: 'text-green-700', bgColor: 'bg-green-100', dotColor: 'bg-green-500' },
}

export const STATUS_ORDER: HomeworkStatus[] = [
  'todo',
  'in_progress',
  'submitted',
  'graded',
  'revised',
]

export function getSubjectName(subject: Subject): string {
  return SUBJECT_CONFIG[subject]?.name || subject
}

export function getSubjectColor(subject: Subject): string {
  return SUBJECT_CONFIG[subject]?.color || '#6b7280'
}

export function getStatusName(status: HomeworkStatus): string {
  return STATUS_CONFIG[status]?.name || status
}

export function getAllSubjects(): Subject[] {
  return Object.keys(SUBJECT_CONFIG) as Subject[]
}
