import { getDB, id } from './index'
import type { PointsRecord, PresetRule } from '../types'

export async function addPointsRecord(record: Omit<PointsRecord, 'id'>): Promise<PointsRecord> {
  const db = await getDB()
  const r: PointsRecord = { ...record, id: id() }
  await db.add('pointsRecords', r)
  return r
}

export async function listPointsRecords(studentId?: string, from?: number, to?: number): Promise<PointsRecord[]> {
  const db = await getDB()
  let list: PointsRecord[]
  if (studentId) {
    list = await db.getAllFromIndex('pointsRecords', 'by-student', studentId)
  } else {
    list = await db.getAll('pointsRecords')
  }
  list.sort((a, b) => b.at - a.at)
  if (from != null) list = list.filter((r) => r.at >= from)
  if (to != null) list = list.filter((r) => r.at <= to)
  return list
}

/** 计算某学生在某时间段的积分变化（不删记录，只读） */
export function sumDelta(records: PointsRecord[], studentId: string): number {
  return records
    .filter((r) => r.studentIds.includes(studentId))
    .reduce((sum, r) => sum + r.delta, 0)
}

export async function getPresetRules(): Promise<PresetRule[]> {
  const db = await getDB()
  return db.getAll('presetRules')
}

export async function savePresetRule(rule: PresetRule): Promise<void> {
  const db = await getDB()
  await db.put('presetRules', rule)
}

export async function deletePresetRule(ruleId: string): Promise<void> {
  const db = await getDB()
  await db.delete('presetRules', ruleId)
}

export const defaultPresetRules: PresetRule[] = [
  { id: 'rule-1', label: '主动答题', defaultDelta: 2, defaultReason: '主动答题' },
  { id: 'rule-2', label: '纪律差', defaultDelta: -1, defaultReason: '纪律差' },
  { id: 'rule-3', label: '优秀作业', defaultDelta: 3, defaultReason: '优秀作业' },
  { id: 'rule-4', label: '迟到', defaultDelta: -2, defaultReason: '迟到' },
  { id: 'rule-5', label: '帮助同学', defaultDelta: 2, defaultReason: '帮助同学' }
]

export async function ensureDefaultPresetRules(): Promise<void> {
  const db = await getDB()
  const existing = await db.count('presetRules')
  if (existing === 0) {
    for (const r of defaultPresetRules) await db.add('presetRules', r)
  }
}
