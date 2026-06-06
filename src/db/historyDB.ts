import { addRecord, getAllByIndex, STORES } from './index'
import type { HistoryRecord } from '@/types/history'
import { nanoid } from 'nanoid'

export async function createHistoryRecord(input: Omit<HistoryRecord, 'id'>): Promise<HistoryRecord> {
  const record: HistoryRecord = {
    id: nanoid(),
    ...input,
  }
  await addRecord(STORES.HISTORY_RECORDS, record)
  return record
}

export async function getHistoryByHomework(homeworkId: string): Promise<HistoryRecord[]> {
  const records = await getAllByIndex(STORES.HISTORY_RECORDS, 'homeworkId', homeworkId)
  return records.sort(
    (a: HistoryRecord, b: HistoryRecord) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export async function getHistoryByOperator(operatorId: string): Promise<HistoryRecord[]> {
  const records = await getAllByIndex(STORES.HISTORY_RECORDS, 'operatorId', operatorId)
  return records.sort(
    (a: HistoryRecord, b: HistoryRecord) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}
