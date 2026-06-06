import { addRecord, getRecord, getAllRecords, getAllByIndex, STORES, putRecord } from './index'
import type { User, UserRole } from '@/types/user'
import { nanoid } from 'nanoid'

export async function createUser(input: Omit<User, 'id'>): Promise<User> {
  const user: User = {
    id: nanoid(),
    ...input,
  }
  await addRecord(STORES.USERS, user)
  return user
}

export async function getUser(id: string): Promise<User | undefined> {
  return getRecord(STORES.USERS, id)
}

export async function updateUser(user: User): Promise<User> {
  await putRecord(STORES.USERS, user)
  return user
}

export async function getAllUsers(): Promise<User[]> {
  return getAllRecords(STORES.USERS)
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  return getAllByIndex(STORES.USERS, 'role', role)
}

export async function getTeachers(): Promise<User[]> {
  return getUsersByRole('teacher')
}

export async function getStudents(): Promise<User[]> {
  return getUsersByRole('student')
}

export async function initMockUsers(): Promise<void> {
  const existing = await getAllUsers()
  if (existing.length > 0) return

  const teachers = [
    { name: '王老师', role: 'teacher' as UserRole, subject: '语文', className: '高一(1)班' },
    { name: '李老师', role: 'teacher' as UserRole, subject: '数学', className: '高一(1)班' },
    { name: '张老师', role: 'teacher' as UserRole, subject: '英语', className: '高一(1)班' },
    { name: '陈老师', role: 'teacher' as UserRole, subject: '物理', className: '高一(1)班' },
    { name: '刘老师', role: 'teacher' as UserRole, subject: '化学', className: '高一(1)班' },
    { name: '赵老师', role: 'teacher' as UserRole, subject: '生物', className: '高一(1)班' },
  ]

  const studentNames = [
    '张伟', '王芳', '李娜', '刘洋', '陈静',
    '杨帆', '赵敏', '黄磊', '周婷', '吴强',
  ]

  const students = studentNames.map((name) => ({
    name,
    role: 'student' as UserRole,
    className: '高一(1)班',
  }))

  for (const t of teachers) {
    await createUser(t)
  }
  for (const s of students) {
    await createUser(s)
  }
}
