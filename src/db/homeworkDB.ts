import {
  addRecord,
  getRecord,
  putRecord,
  getAllRecords,
  getAllByIndex,
  deleteRecord,
  STORES,
} from './index'
import type {
  Homework,
  HomeworkCreateInput,
  HomeworkUpdateInput,
  HomeworkStatus,
  Subject,
} from '@/types/homework'
import { nanoid } from 'nanoid'
import { getTeachers, getStudents } from './userDB'

export async function createHomework(input: HomeworkCreateInput): Promise<Homework> {
  const now = new Date().toISOString()
  const homework: Homework = {
    id: nanoid(),
    status: 'todo',
    isDeleted: false,
    needsRevision: false,
    attachments: [],
    revisionAttachments: [],
    createdAt: now,
    updatedAt: now,
    ...input,
  }
  await addRecord(STORES.HOMEWORKS, homework)
  return homework
}

export async function getHomework(id: string): Promise<Homework | undefined> {
  return getRecord(STORES.HOMEWORKS, id)
}

export async function updateHomework(input: HomeworkUpdateInput): Promise<Homework | undefined> {
  const existing = await getHomework(input.id)
  if (!existing) return undefined

  const updated: Homework = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  }
  await putRecord(STORES.HOMEWORKS, updated)
  return updated
}

export async function softDeleteHomework(id: string): Promise<Homework | undefined> {
  const existing = await getHomework(id)
  if (!existing) return undefined

  if (existing.status === 'submitted' || existing.status === 'graded' || existing.status === 'revised') {
    const updated: Homework = {
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    }
    await putRecord(STORES.HOMEWORKS, updated)
    return updated
  } else {
    await deleteRecord(STORES.HOMEWORKS, id)
    return undefined
  }
}

export async function getAllHomeworks(includeDeleted: boolean = false): Promise<Homework[]> {
  const all = await getAllRecords(STORES.HOMEWORKS)
  return includeDeleted ? all : all.filter((h: Homework) => !h.isDeleted)
}

export async function getHomeworksByStudent(studentId: string, includeDeleted: boolean = false): Promise<Homework[]> {
  const all = await getAllByIndex(STORES.HOMEWORKS, 'studentId', studentId)
  return includeDeleted ? all : all.filter((h: Homework) => !h.isDeleted)
}

export async function getHomeworksByStatus(status: HomeworkStatus, includeDeleted: boolean = false): Promise<Homework[]> {
  const all = await getAllByIndex(STORES.HOMEWORKS, 'status', status)
  return includeDeleted ? all : all.filter((h: Homework) => !h.isDeleted)
}

export async function getHomeworksBySubject(subject: Subject, includeDeleted: boolean = false): Promise<Homework[]> {
  const all = await getAllByIndex(STORES.HOMEWORKS, 'subject', subject)
  return includeDeleted ? all : all.filter((h: Homework) => !h.isDeleted)
}

export async function batchCreateHomeworks(inputs: HomeworkCreateInput[]): Promise<Homework[]> {
  const results: Homework[] = []
  for (const input of inputs) {
    const homework = await createHomework(input)
    results.push(homework)
  }
  return results
}

export async function initMockHomeworks(): Promise<void> {
  const existing = await getAllHomeworks()
  if (existing.length > 0) return

  const teachers = await getTeachers()
  const students = await getStudents()
  if (teachers.length === 0 || students.length === 0) return

  const subjects: Subject[] = ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology']
  const statuses: HomeworkStatus[] = ['todo', 'in_progress', 'submitted', 'graded', 'revised']
  const titles = [
    '第一章课后习题', '单元测试卷', '期中复习题', '期末模拟卷',
    '阅读理解练习', '作文练习', '计算题专项', '实验报告',
  ]

  const now = new Date()

  for (let i = 0; i < 30; i++) {
    const student = students[i % students.length]
    const subjectIndex = Math.floor(i / 5) % subjects.length
    const subject = subjects[subjectIndex]
    const teacher = teachers.find((t) => t.subject === subject) || teachers[0]
    const status = statuses[i % statuses.length]
    const title = titles[i % titles.length] + ` (${subject})`

    const assignedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    const deadline = new Date(assignedAt.getTime() + 3 * 24 * 60 * 60 * 1000)

    const homeworkData: HomeworkCreateInput = {
      subject,
      title,
      description: `请完成${title}的所有题目，注意书写规范，按时提交。`,
      studentId: student.id,
      studentName: student.name,
      assignedBy: teacher.id,
      assignedByName: teacher.name,
      assignedAt: assignedAt.toISOString(),
      deadline: deadline.toISOString(),
    }

    const homework = await createHomework(homeworkData)

    if (status === 'in_progress') {
      homework.status = 'in_progress'
      homework.startedAt = new Date(assignedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
      await putRecord(STORES.HOMEWORKS, { ...homework, updatedAt: new Date().toISOString() })
    } else if (status === 'submitted') {
      homework.status = 'submitted'
      const startedAtTime = assignedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000
      homework.startedAt = new Date(startedAtTime).toISOString()
      homework.submittedAt = new Date(startedAtTime + Math.random() * 24 * 60 * 60 * 1000).toISOString()
      await putRecord(STORES.HOMEWORKS, { ...homework, updatedAt: new Date().toISOString() })
    } else if (status === 'graded') {
      const score = Math.floor(Math.random() * 60) + 40
      homework.status = 'graded'
      const startedAtTime = assignedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000
      const submittedAtTime = startedAtTime + Math.random() * 24 * 60 * 60 * 1000
      const gradedAtTime = submittedAtTime + Math.random() * 24 * 60 * 60 * 1000
      homework.startedAt = new Date(startedAtTime).toISOString()
      homework.submittedAt = new Date(submittedAtTime).toISOString()
      homework.gradedAt = new Date(gradedAtTime).toISOString()
      homework.score = score
      homework.gradedBy = teacher.id
      homework.gradedByName = teacher.name
      homework.comment = score >= 60 ? '完成得不错，继续保持！' : '基础还需要加强，建议订正后再提交。'
      homework.needsRevision = score < 60
      await putRecord(STORES.HOMEWORKS, { ...homework, updatedAt: new Date().toISOString() })
    } else if (status === 'revised') {
      const score = Math.floor(Math.random() * 40) + 30
      const revisionScore = Math.floor(Math.random() * 30) + 60
      homework.status = 'revised'
      const startedAtTime = assignedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000
      const submittedAtTime = startedAtTime + Math.random() * 24 * 60 * 60 * 1000
      const gradedAtTime = submittedAtTime + Math.random() * 24 * 60 * 60 * 1000
      const revisedAtTime = gradedAtTime + Math.random() * 48 * 60 * 60 * 1000
      homework.startedAt = new Date(startedAtTime).toISOString()
      homework.submittedAt = new Date(submittedAtTime).toISOString()
      homework.gradedAt = new Date(gradedAtTime).toISOString()
      homework.score = score
      homework.gradedBy = teacher.id
      homework.gradedByName = teacher.name
      homework.comment = '需要订正，注意基础概念的理解。'
      homework.needsRevision = true
      homework.revisedAt = new Date(revisedAtTime).toISOString()
      homework.revisionScore = revisionScore
      homework.revisionTime = Math.floor(Math.random() * 60) + 20
      await putRecord(STORES.HOMEWORKS, { ...homework, updatedAt: new Date().toISOString() })
    }
  }
}
