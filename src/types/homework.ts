export type HomeworkStatus =
  | 'todo'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'revised'

export type Subject =
  | 'chinese'
  | 'math'
  | 'english'
  | 'physics'
  | 'chemistry'
  | 'biology'

export type FinalScoreRule = 'original' | 'average'

export interface Homework {
  id: string
  subject: Subject
  title: string
  description: string
  studentId: string
  studentName: string
  status: HomeworkStatus
  assignedBy: string
  assignedByName: string
  assignedAt: string
  deadline: string
  startedAt?: string
  submittedAt?: string
  gradedAt?: string
  revisedAt?: string
  score?: number
  gradedBy?: string
  gradedByName?: string
  comment?: string
  needsRevision: boolean
  revisionScore?: number
  revisionTime?: number
  finalScoreRule?: FinalScoreRule
  attachments: string[]
  revisionAttachments: string[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type HomeworkCreateInput = Omit<
  Homework,
  | 'id'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'isDeleted'
  | 'needsRevision'
  | 'attachments'
  | 'revisionAttachments'
> & {
  attachments?: string[]
}

export type HomeworkUpdateInput = Partial<Homework> & { id: string }
