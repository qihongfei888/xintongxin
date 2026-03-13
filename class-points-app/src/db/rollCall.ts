import { getDB, id } from './index'
import type { RollCallRecord } from '../types'

export async function addRollCallRecord(studentId: string): Promise<RollCallRecord> {
  const db = await getDB()
  const r: RollCallRecord = { id: id(), studentId, at: Date.now() }
  await db.add('rollCallRecords', r)
  return r
}

export async function getRollCallCountByStudent(studentId: string): Promise<number> {
  const db = await getDB()
  const list = await db.getAllFromIndex('rollCallRecords', 'by-at')
  return list.filter((r) => r.studentId === studentId).length
}

export async function listRollCallRecords(limit = 100): Promise<RollCallRecord[]> {
  const db = await getDB()
  const list = await db.getAllFromIndex('rollCallRecords', 'by-at')
  return list.sort((a, b) => b.at - a.at).slice(0, limit)
}
